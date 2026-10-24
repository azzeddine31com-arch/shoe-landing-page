import { clamp } from '../utils/dom.js';

/**
 * Scroll-scrubbed single video.
 *
 * The video never plays on its own: a rAF loop eases video.currentTime toward
 * a scroll-derived target time. The loop self-suspends when settled and while
 * the tab is hidden, so there are no idle animation loops.
 */
export class VideoScrubber {
  constructor(video, src) {
    this.video = video;
    this.src = src;
    this.targetTime = 0;
    this.duration = 0;
    this.rafId = 0;
    this.running = false;
    this.ready = false;
    this.failed = false;

    this._onVisibility = this._onVisibility.bind(this);
    this._tick = this._tick.bind(this);

    video.muted = true;
    video.preload = 'auto';
    video.src = src;
    video.load();

    this.readyPromise = new Promise((resolve) => {
      const onReady = () => {
        this.duration = video.duration || 0;
        this.ready = true;
        video.pause();
        // force decode of the first frame so poster never flashes to black
        try {
          video.currentTime = 0;
        } catch {
          /* metadata not seekable yet */
        }
        resolve(true);
      };
      const onError = () => {
        this.failed = true;
        resolve(false);
      };
      video.addEventListener('loadeddata', onReady, { once: true });
      video.addEventListener('error', onError, { once: true });
    });

    document.addEventListener('visibilitychange', this._onVisibility);
  }

  _onVisibility() {
    if (document.hidden) {
      this._stopLoop();
    } else if (this.ready) {
      this._ensureLoop();
    }
  }

  /** progress 0..1 → target currentTime */
  setProgress(progress) {
    if (!this.ready || !this.duration) return;
    const target = clamp(progress) * (this.duration - 0.03);
    if (Math.abs(target - this.targetTime) < 0.004) return;
    this.targetTime = target;
    this._ensureLoop();
  }

  _ensureLoop() {
    if (!this.running && !document.hidden) {
      this.running = true;
      this.rafId = requestAnimationFrame(this._tick);
    }
  }

  _stopLoop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  _tick() {
    const v = this.video;
    if (!this.running) return;

    if (this.ready && this.duration) {
      const diff = this.targetTime - v.currentTime;
      const abs = Math.abs(diff);
      if (abs > 0.012) {
        let next;
        if (abs > 0.55) {
          // fast scroll / big jump: seek directly to avoid permanent lag
          next = this.targetTime;
        } else {
          // gentle easing for precise, reversible scrubbing
          next = v.currentTime + diff * 0.22;
        }
        const clamped = clamp(next, 0, this.duration - 0.02);
        if (Math.abs(clamped - v.currentTime) >= 0.01) {
          v.currentTime = clamped;
        }
      } else if (!v.paused) {
        v.pause();
      }
      if (abs <= 0.02) {
        this._stopLoop();
        return;
      }
    }
    this.rafId = requestAnimationFrame(this._tick);
  }

  destroy() {
    this._stopLoop();
    this.ready = false;
    document.removeEventListener('visibilitychange', this._onVisibility);
    this.video.removeAttribute('src');
    this.video.load();
  }
}
