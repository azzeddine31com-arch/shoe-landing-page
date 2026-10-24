import { COLORS } from '../config.js';
import { selection } from '../state/selection.js';
import { $ } from '../utils/dom.js';

const bgSrc = (id) => `/assets/img/colors/bg-${id}.webp`;
const thSrc = (id) => `/assets/img/colors/th-${id}.webp`;

export function initColorSelector() {
  const main = $('#color-main');
  const thumbs = $('#color-thumbs');
  const nameEl = $('#color-name');
  const section = $('#colors');

  // stacked backgrounds, cross-faded via .is-active
  main.innerHTML = COLORS.map(
    (c) => `
      <img ${c.id === selection.color ? `src="${bgSrc(c.id)}"` : ''}
        data-src="${bgSrc(c.id)}"
        alt="حذاء العمل باللون ${c.label}" width="1280" height="2293"
        decoding="async" loading="lazy" />`,
  ).join('');

  thumbs.innerHTML = COLORS.map(
    (c) => `
      <button type="button" class="thumb" role="radio" aria-checked="false"
        data-color="${c.id}" tabindex="-1">
        <img src="${thSrc(c.id)}" alt="" width="320" height="419" loading="lazy" decoding="async" />
        <span class="thumb__check" aria-hidden="true">✓</span>
        <span class="thumb__label">${c.label}</span>
      </button>`,
  ).join('');

  const thumbEls = Array.from(thumbs.querySelectorAll('.thumb'));
  const bgEls = Array.from(main.querySelectorAll('img'));
  const colorLabel = (id) => COLORS.find((c) => c.id === id)?.label ?? '';

  // progressive loading of the remaining large backgrounds near the section
  const lazyIO = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      bgEls.forEach((img) => {
        if (!img.src && img.dataset.src) img.src = img.dataset.src;
      });
      lazyIO.disconnect();
    },
    { rootMargin: '400px 0px' },
  );
  lazyIO.observe(section);

  function render(colorId) {
    bgEls.forEach((img, i) =>
      img.classList.toggle('is-active', COLORS[i].id === colorId),
    );
    thumbEls.forEach((btn, i) => {
      const selected = COLORS[i].id === colorId;
      btn.classList.toggle('is-selected', selected);
      btn.setAttribute('aria-checked', String(selected));
      btn.tabIndex = selected ? 0 : -1;
    });
    nameEl.textContent = colorLabel(colorId);
  }

  thumbEls.forEach((btn, i) => {
    btn.addEventListener('click', () => selection.setColor(btn.dataset.color));
    btn.addEventListener('keydown', (e) => {
      const dir = ['ArrowLeft', 'ArrowDown'].includes(e.key)
        ? 1
        : ['ArrowRight', 'ArrowUp'].includes(e.key)
          ? -1
          : 0;
      if (!dir) return;
      e.preventDefault();
      const next = (i + dir + COLORS.length) % COLORS.length;
      thumbEls[next].focus();
      selection.setColor(COLORS[next].id);
    });
  });

  selection.subscribe(({ color }) => render(color));
}
