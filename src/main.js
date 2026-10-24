import './styles/index.css';

import { reducedMotionMQ, scrollToY } from './js/utils/dom.js';
import { initHero } from './js/ui/hero.js';
import { initCinematic } from './js/motion/cinematic.js';
import { initColorSelector } from './js/ui/color-selector.js';
import { initOrderForm } from './js/ui/order-form.js';
import { initFaq } from './js/ui/faq.js';
import { initReveals } from './js/ui/reveal.js';

// Global flag used by CSS to switch to the reduced-motion layout.
if (reducedMotionMQ.matches) {
  document.documentElement.classList.add('reduced-motion');
}
reducedMotionMQ.addEventListener?.('change', (e) => {
  document.documentElement.classList.toggle('reduced-motion', e.matches);
});

// Smooth in-page anchors (native, respects reduced motion via CSS).
document.querySelectorAll('[data-scroll]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    scrollToY(
      target.getBoundingClientRect().top + window.scrollY - 4,
    );
  });
});

function boot(name, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`[${name}] init failed:`, err);
  }
}

boot('hero', initHero);
boot('cinematic', initCinematic);
boot('color-selector', initColorSelector);
boot('order-form', initOrderForm);
boot('faq', initFaq);
boot('reveals', initReveals);

// Last-resort visibility guard: if the hero tween never runs (blocked JS
// module, failed chunk), the headline must not stay clipped in its mask.
window.setTimeout(() => {
  document.querySelectorAll('.mask-line__inner').forEach((el) => {
    el.style.transform = 'none';
  });
}, 2800);
