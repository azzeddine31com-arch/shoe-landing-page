import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import manifest from '../data/media-manifest.json' with { type: 'json' };
import { CHAPTERS } from '../data/chapters.js';
import { VideoScrubber } from './video-scrubber.js';
import {
  $,
  clamp,
  smoothstep,
  reducedMotionMQ,
  isMobileMQ,
  scrollToY,
} from '../utils/dom.js';

gsap.registerPlugin(ScrollTrigger);

const FADE = 0.018; // global-progress fade window for captions
const CALLOUT_HALF = 0.055;
const READY_TIMEOUT = 12000;

/** Representative still per chapter (reduced-motion / failure fallback). */
const CHAPTER_STILL = {
  craft: 'ch1-dial',
  toe: 'ch2-toe',
  'puncture-grip': 'ch3-layer',
  comfort: 'ch4-foam',
  construction: 'ch5-exploded',
};

export function clipWindow(clipIndexes) {
  const clips = clipIndexes.map((i) => manifest.clips.find((c) => c.index === i));
  const start = Math.min(...clips.map((c) => c.start)) / manifest.totalDuration;
  const end = Math.max(...clips.map((c) => c.end)) / manifest.totalDuration;
  return { start, end };
}

/** Split each chapter window across its text beats. */
export function buildBeatWindows() {
  const beats = [];
  CHAPTERS.forEach((chapter, ci) => {
    const win = clipWindow(chapter.clips);
    const span = win.end - win.start;
    const n = chapter.beats.length;
    chapter.beats.forEach((beat, bi) => {
      beats.push({
        chapterId: chapter.id,
        chapterIndex: ci,
        kicker: bi === 0 ? chapter.kicker : null,
        ...beat,
        start: win.start + (span * bi) / n,
        end: win.start + (span * (bi + 1)) / n,
        calloutCenter: beat.callout
          ? win.start + (beat.calloutAt || 0.5) * span
          : null,
      });
    });
  });
  return beats;
}

export function initCinematic() {
  const story = $('#story');
  const video = $('.story__video');
  const captionsRoot = $('#story-captions');
  const dotsRoot = $('#story-dots');
  const loading = $('#story-loading');

  const beats = buildBeatWindows();
  const chapterWindows = CHAPTERS.map((c) => clipWindow(c.clips));

  let activeScrubber = null;

  /* ---------------- reduced motion: static still-frame story ---------------- */
  function activateFallback() {
    document.documentElement.classList.add('reduced-motion');
    if (activeScrubber) {
      activeScrubber.destroy();
      activeScrubber = null;
    }
    const fb = $('#story-fallback');
    fb.innerHTML = CHAPTERS.map((chapter) => {
      const still = manifest.stills.find((s) => s.id === CHAPTER_STILL[chapter.id]);
      const beat = chapter.beats[0];
      return `
        <article class="fallback-chapter wrap">
          <img src="${still.src}" alt="" loading="lazy" decoding="async" width="720" height="1280" />
          <span class="caption__kicker">${chapter.kicker}</span>
          <h3 class="caption__title">${beat.headline}</h3>
          <p class="caption__sub">${beat.sub}</p>
        </article>`;
    }).join('');
    fb.hidden = false;
    if (loading) loading.remove();
    captionsRoot.remove();
    dotsRoot.remove();
  }

  if (reducedMotionMQ.matches) {
    activateFallback();
    return;
  }

  /* ---------------- caption + dot DOM ---------------- */
  captionsRoot.innerHTML = beats
    .map(
      (b) => `
      <article class="caption" aria-hidden="true">
        ${b.kicker ? `<span class="caption__kicker">${b.kicker}</span>` : ''}
        <h3 class="caption__title">${b.headline}</h3>
        <p class="caption__sub">${b.sub}</p>
        ${
          b.callout
            ? `<span class="caption__callout">${b.callout}</span>`
            : ''
        }
      </article>`,
    )
    .join('');
  const captionEls = Array.from(captionsRoot.children);

  dotsRoot.innerHTML = CHAPTERS.map(
    (c, i) =>
      `<button type="button" data-chapter="${i}" aria-label="${c.kicker}"></button>`,
  ).join('');
  const dotEls = Array.from(dotsRoot.children);

  /* ---------------- video source (tier picked once) ---------------- */
  const src = isMobileMQ.matches ? manifest.video.mobile : manifest.video.desktop;
  const scrubber = new VideoScrubber(video, src);
  activeScrubber = scrubber;

  let activeChapter = -1;
  const bar = $('#story-progress-bar');

  function setActiveChapter(i) {
    if (i === activeChapter) return;
    activeChapter = i;
    dotEls.forEach((d, di) => d.classList.toggle('is-active', di === i));
  }

  function update(progress) {
    const p = clamp(progress);
    scrubber.setProgress(p);
    bar.style.transform = `scaleX(${p})`;

    captionEls.forEach((el, i) => {
      const b = beats[i];
      // the opening beat is already on screen at the very top of the story
      const fadeIn = b.start === 0 ? 1 : smoothstep(b.start, b.start + FADE, p);
      const fadeOut = 1 - smoothstep(b.end - FADE, b.end, p);
      const alpha = fadeIn * fadeOut;
      el.style.opacity = alpha.toFixed(3);
      el.style.transform = `translateY(${((1 - alpha) * 28).toFixed(2)}px)`;
      el.setAttribute('aria-hidden', alpha < 0.05 ? 'true' : 'false');
      const callout = el.querySelector('.caption__callout');
      if (callout && b.calloutCenter !== null) {
        const on = Math.abs(p - b.calloutCenter) < CALLOUT_HALF && alpha > 0.4;
        callout.classList.toggle('is-on', on);
      }
    });

    const idx = chapterWindows.findIndex(
      (w) => p >= w.start - 0.001 && p <= w.end + 0.001,
    );
    setActiveChapter(idx === -1 ? clamp(Math.round(p * (CHAPTERS.length - 1)), 0, CHAPTERS.length - 1) : idx);
  }

  dotEls.forEach((dot) => {
    dot.addEventListener('click', () => {
      const i = Number(dot.dataset.chapter);
      const rect = story.getBoundingClientRect();
      const y =
        window.scrollY +
        rect.top +
        chapterWindows[i].start * (rect.height - window.innerHeight);
      scrollToY(y);
    });
  });

  /* ---------------- one scroll trigger drives everything ---------------- */
  ScrollTrigger.create({
    trigger: story,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => update(self.progress),
    onToggle: (self) => {
      // guarantee correct frame when entering/leaving the pinned zone
      if (self.isActive) update(self.progress);
    },
  });

  const safetyTimer = window.setTimeout(() => {
    if (!scrubber.ready && !scrubber.failed) activateFallback();
  }, READY_TIMEOUT);

  scrubber.readyPromise.then((ok) => {
    window.clearTimeout(safetyTimer);
    if (!ok || document.documentElement.classList.contains('reduced-motion')) {
      if (!ok) activateFallback();
      return;
    }
    loading.classList.add('is-hidden');
    window.setTimeout(() => loading.remove(), 700);
    update(0);
    ScrollTrigger.refresh();
  });

  // re-measure once web fonts have settled (avoids pin-length drift)
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}
