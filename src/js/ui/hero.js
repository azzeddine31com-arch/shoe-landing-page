import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { reducedMotionMQ } from '../utils/dom.js';

gsap.registerPlugin(ScrollTrigger);

export function initHero() {
  const lines = Array.from(document.querySelectorAll('.mask-line__inner'));
  const content = document.querySelector('.hero__content');
  const media = document.querySelector('.hero__media img');
  const hint = document.querySelector('.hero__hint');

  if (reducedMotionMQ.matches) {
    gsap.set(lines, { y: 0 });
    return;
  }

  const tl = gsap.timeline({ delay: 0.15, defaults: { ease: 'power4.out' } });
  tl.fromTo(
    lines,
    { yPercent: 110 },
    { yPercent: 0, duration: 1.1, stagger: 0.14 },
  )
    .fromTo(
      ['.hero__kicker', '.hero__sub', '.hero .cta--hero'],
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.12 },
      '-=0.55',
    )
    .fromTo(hint, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, '-=0.3');

  // gentle parallax + content fade as the visitor leaves the hero
  gsap.to(media, {
    scale: 1.16,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom 30%',
      scrub: true,
    },
  });
  gsap.to(content, {
    autoAlpha: 0,
    y: -40,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom 45%',
      scrub: true,
    },
  });
  gsap.to(hint, {
    autoAlpha: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom 80%',
      scrub: true,
    },
  });
}
