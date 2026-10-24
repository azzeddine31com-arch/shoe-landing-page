import { reducedMotionMQ } from '../utils/dom.js';

/**
 * Lightweight IntersectionObserver entrance reveals.
 * Adds data-reveal hooks at runtime so markup stays clean.
 */
const TARGETS = [
  '.colors__head',
  '.colors__stage',
  '.order__panel',
  '.faq__head',
  '.faq-item',
];

export function initReveals() {
  const els = TARGETS.flatMap((sel) =>
    Array.from(document.querySelectorAll(sel)),
  );

  if (reducedMotionMQ.matches || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
  );

  els.forEach((el, i) => {
    el.setAttribute('data-reveal', '');
    if (el.classList.contains('faq-item')) {
      el.style.setProperty('--reveal-delay', `${Math.min(i * 0.06, 0.3)}s`);
    }
    io.observe(el);
  });
}
