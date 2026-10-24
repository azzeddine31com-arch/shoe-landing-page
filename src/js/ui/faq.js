import { FAQ_ITEMS } from '../data/faq.js';
import { $ } from '../utils/dom.js';

export function initFaq() {
  const root = $('#faq-list');

  root.innerHTML = FAQ_ITEMS.map(
    (item, i) => `
      <div class="faq-item" data-faq>
        <h3 style="margin:0">
          <button type="button" class="faq-item__btn" aria-expanded="false"
            aria-controls="faq-panel-${i}" id="faq-btn-${i}">
            <span>${item.q}</span>
            <span class="faq-item__icon" aria-hidden="true">+</span>
          </button>
        </h3>
        <div class="faq-item__panel" id="faq-panel-${i}" role="region"
          aria-labelledby="faq-btn-${i}" hidden>
          <div class="faq-item__panel-inner">
            <p>${item.a}</p>
          </div>
        </div>
      </div>`,
  ).join('');

  const items = Array.from(root.querySelectorAll('[data-faq]'));

  function setOpen(item, open) {
    const btn = item.querySelector('.faq-item__btn');
    const panel = item.querySelector('.faq-item__panel');
    btn.setAttribute('aria-expanded', String(open));
    if (open) {
      panel.hidden = false;
      // wait one frame so the grid 0fr → 1fr transition actually runs
      requestAnimationFrame(() =>
        requestAnimationFrame(() => item.classList.add('is-open')),
      );
    } else {
      item.classList.remove('is-open');
      // keep the grid animation visible while closing, then hide
      window.setTimeout(() => {
        if (!item.classList.contains('is-open')) panel.hidden = true;
      }, 450);
    }
  }

  items.forEach((item) => {
    const btn = item.querySelector('.faq-item__btn');
    btn.addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      items.forEach((other) => other !== item && setOpen(other, false));
      setOpen(item, willOpen);
    });
  });
}
