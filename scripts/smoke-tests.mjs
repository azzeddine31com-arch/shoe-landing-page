/**
 * Node + jsdom smoke tests for page logic (no browser rendering required).
 * Run: npm run test:logic
 */
import { JSDOM } from 'jsdom';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(path.join(root, 'index.html'), 'utf8');

const dom = new JSDOM(html, {
  url: 'https://example.test/',
  pretendToBeVisual: true,
});

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;
global.localStorage = dom.window.localStorage;
global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

dom.window.matchMedia = (query) => ({
  matches: false,
  media: query,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
});
dom.window.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
global.IntersectionObserver = dom.window.IntersectionObserver;
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};

let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
};

/* ------------------------------ data tests ------------------------------ */
const { WILAYAS } = await import('../src/js/data/wilayas.js');
const { FAQ_ITEMS } = await import('../src/js/data/faq.js');
const { CHAPTERS } = await import('../src/js/data/chapters.js');
const manifest = (
  await import('../src/js/data/media-manifest.json', { with: { type: 'json' } })
).default;
const { PRICING, COLORS, SIZES, formatDZD } = await import('../src/js/config.js');

test('58 wilayas with unique official codes 1..58', () => {
  assert.equal(WILAYAS.length, 58);
  const codes = WILAYAS.map((w) => w.code);
  assert.deepEqual(codes, Array.from({ length: 58 }, (_, i) => i + 1));
  assert.equal(new Set(WILAYAS.map((w) => w.name)).size, 58);
});

test('FAQ ships 4 verification-aware items', () => {
  assert.equal(FAQ_ITEMS.length, 4);
  assert.ok(FAQ_ITEMS.every((i) => i.q && i.a));
});

test('chapters cover all 11 clips exactly once', () => {
  const used = CHAPTERS.flatMap((c) => c.clips).sort((a, b) => a - b);
  assert.deepEqual(used, Array.from({ length: 11 }, (_, i) => i + 1));
});

test('media manifest is continuous and files exist on disk', () => {
  assert.ok(manifest.totalDuration > 22);
  assert.equal(manifest.clips.length, 11);
  manifest.clips.reduce((prevEnd, c) => {
    assert.ok(c.start >= prevEnd - 1e-9);
    return c.end;
  }, 0);
  for (const f of [manifest.video.desktop, manifest.video.mobile]) {
    assert.ok(existsSync(path.join(root, 'public', f)));
  }
  assert.ok(manifest.stills.length >= 10);
});

test('pricing source of truth is internally consistent', () => {
  assert.equal(PRICING.savings, PRICING.originalPrice - PRICING.currentPrice);
  assert.ok(formatDZD(2900).includes('2.900'));
  assert.equal(SIZES.length, 6);
  assert.equal(COLORS.length, 3);
});

/* --------------------------- component tests ---------------------------- */
const { selection } = await import('../src/js/state/selection.js');
const { initOrderForm } = await import('../src/js/ui/order-form.js');
const { initColorSelector } = await import('../src/js/ui/color-selector.js');
const { initFaq } = await import('../src/js/ui/faq.js');

initOrderForm();
initColorSelector();
initFaq();

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

test('form contains all 58 wilaya options + placeholder', () => {
  assert.equal($('#f-wilaya').options.length, 59);
});

test('store defaults: grey (matches cinematic shoe), qty 1, no size', () => {
  assert.equal(selection.color, 'grey');
  assert.equal(selection.quantity, 1);
  assert.equal(selection.size, null);
  assert.equal(selection.total, PRICING.currentPrice);
});

test('color selector renders the default grey as initially selected', () => {
  const activeBg = $$('#color-main img').find((i) => i.classList.contains('is-active'));
  assert.equal(activeBg.dataset.src, '/assets/img/colors/bg-grey.webp');
  const greyThumb = $('#color-thumbs [data-color="grey"]');
  assert.equal(greyThumb.getAttribute('aria-checked'), 'true');
  assert.equal(greyThumb.tabIndex, 0);
});

test('quantity stepper clamps 1..10 and updates total', () => {
  const inc = $('[data-qty="inc"]');
  const dec = $('[data-qty="dec"]');
  inc.click();
  inc.click();
  assert.equal(selection.quantity, 3);
  assert.equal($('#price-total').textContent, formatDZD(3 * PRICING.currentPrice));
  for (let i = 0; i < 20; i++) dec.click();
  assert.equal(selection.quantity, 1);
  for (let i = 0; i < 20; i++) inc.click();
  assert.equal(selection.quantity, 10);
  selection.setQuantity(1);
});

test('empty submit blocks with field-level Arabic errors (size still unset)', () => {
  assert.equal(selection.size, null);
  $('#order-form').requestSubmit();
  assert.equal($('#f-name').closest('.field').classList.contains('has-error'), true);
  assert.equal($('#f-phone').closest('.field').classList.contains('has-error'), true);
  assert.equal($('#f-wilaya').closest('.field').classList.contains('has-error'), true);
  assert.equal($('#f-address').closest('.field').classList.contains('has-error'), true);
  assert.equal($('#f-size-field').classList.contains('has-error'), true);
  assert.ok($('[data-error-for="phone"]').textContent.includes('رقم الهاتف'));
});

test('Algerian phone validation accepts valid, rejects invalid', () => {
  const phone = $('#f-phone');
  const submit = () => $('#order-form').requestSubmit();
  phone.value = '123';
  submit();
  assert.ok($('#f-phone').closest('.field').classList.contains('has-error'));
  phone.value = '06 12 34 56 78';
  submit();
  assert.equal($('#f-phone').closest('.field').classList.contains('has-error'), false);
  phone.value = '+213512345678';
  submit();
  assert.equal($('#f-phone').closest('.field').classList.contains('has-error'), false);
  phone.value = '0412345678'; // 04 is not a mobile prefix
  submit();
  assert.ok($('#f-phone').closest('.field').classList.contains('has-error'));
});

test('quantity store rejects NaN/garbage without producing NaN totals', () => {
  selection.setQuantity('abc');
  assert.equal(selection.quantity, 1);
  assert.equal(Number.isFinite(selection.total), true);
  selection.setQuantity(0);
  assert.equal(selection.quantity, PRICING.minQty);
  selection.setQuantity(99);
  assert.equal(selection.quantity, PRICING.maxQty);
  selection.setQuantity(2.6);
  assert.equal(selection.quantity, 3);
  selection.setQuantity(1);
});

test('size selection syncs into store and selected state', () => {
  const btn = $('#form-size [data-size="43"]');
  btn.click();
  assert.equal(selection.size, 43);
  assert.equal(btn.getAttribute('aria-checked'), 'true');
});

test('valid submission (no endpoint) shows honest info state + local queue', () => {
  $('#f-name').value = 'أحمد بن محمد';
  $('#f-phone').value = '0555123456';
  $('#f-wilaya').value = '31';
  $('#f-address').value = 'حي النصر، شارع الاستقلال';
  $('#order-form').requestSubmit();
  assert.equal($('#order-result').hidden, false);
  assert.ok($('#order-result-inner').textContent.includes('غير مفعّلة'));
  const queue = JSON.parse(localStorage.getItem('shoe-orders-v1'));
  assert.equal(queue.length, 1);
  assert.equal(queue[0].wilaya, '31');
  assert.equal(queue[0].total, PRICING.currentPrice);
  // edit-again restores form without losing entered values
  $('#order-again').click();
  assert.equal($('#order-result').hidden, true);
  assert.equal($('#order-form').hidden, false);
  assert.equal($('#f-name').value, 'أحمد بن محمد');
});

test('color selector ↔ form two-way sync', () => {
  const blueThumb = $('#color-thumbs [data-color="blue"]');
  blueThumb.click();
  assert.equal(selection.color, 'blue');
  const formBlue = $('#form-color [data-color="blue"]');
  assert.equal(formBlue.getAttribute('aria-checked'), 'true');
  const activeBg = $$('#color-main img').find((i) => i.classList.contains('is-active'));
  assert.equal(activeBg.dataset.src, '/assets/img/colors/bg-blue.webp');
  // change from form side
  $('#form-color [data-color="black"]').click();
  assert.equal(selection.color, 'black');
  assert.equal($('#color-thumbs [data-color="black"]').getAttribute('aria-checked'), 'true');
});

test('honeypot silently drops submission', () => {
  const before = JSON.parse(localStorage.getItem('shoe-orders-v1')).length;
  $('#order-form').elements.hp.value = 'spam';
  $('#order-form').requestSubmit();
  const after = JSON.parse(localStorage.getItem('shoe-orders-v1')).length;
  assert.equal(after, before);
  $('#order-form').elements.hp.value = '';
});

/* ------------------------- cinematic engine tests ------------------------ */
const { clipWindow, buildBeatWindows } = await import(
  '../src/js/motion/cinematic.js'
);
const { VideoScrubber } = await import('../src/js/motion/video-scrubber.js');

test('chapter clip windows map onto the encoded timeline', () => {
  const first = clipWindow(CHAPTERS[0].clips);
  assert.equal(first.start, 0);
  assert.ok(first.end > 0 && first.end < 1);
  CHAPTERS.forEach((c) => {
    const w = clipWindow(c.clips);
    assert.ok(w.start >= 0 && w.end <= 1 && w.end > w.start);
  });
});

test('beat windows are monotonic and span the full story', () => {
  const beats = buildBeatWindows();
  assert.equal(beats.length, CHAPTERS.reduce((n, c) => n + c.beats.length, 0));
  assert.equal(beats[0].start, 0); // opening beat visible from scroll top
  assert.ok(beats.at(-1).end > 0.98);
  beats.reduce((prevEnd, b) => {
    assert.ok(b.start >= prevEnd - 1e-9);
    assert.ok(b.end > b.start);
    return b.end;
  }, 0);
  beats
    .filter((b) => b.callout)
    .forEach((b) =>
      assert.ok(b.calloutCenter > b.start && b.calloutCenter < b.end),
    );
});

test('VideoScrubber is inert before ready and destroys cleanly', () => {
  const video = document.createElement('video');
  const scrubber = new VideoScrubber(video, manifest.video.mobile);
  assert.equal(scrubber.ready, false);
  scrubber.setProgress(0.5); // must no-op, not throw
  assert.equal(video.muted, true);
  scrubber.destroy();
  assert.equal(video.hasAttribute('src'), false);
});

test('FAQ accordion opens/closes with correct ARIA', async () => {
  const items = $$('.faq-item');
  assert.equal(items.length, 4);
  const btn = items[0].querySelector('.faq-item__btn');
  assert.equal(btn.getAttribute('aria-expanded'), 'false');
  btn.click();
  await new Promise((r) => setTimeout(r, 20)); // double-rAF open transition
  assert.equal(items[0].classList.contains('is-open'), true);
  assert.equal(btn.getAttribute('aria-expanded'), 'true');
  assert.equal(items[0].querySelector('.faq-item__panel').hidden, false);
  btn.click();
  assert.equal(items[0].classList.contains('is-open'), false);
});

console.log(`\n${passed} smoke tests passed${process.exitCode ? ' (with failures)' : ''}.`);
// jsdom + the rAF stub keep GSAP's ticker alive; the test work is complete.
process.exit(process.exitCode ?? 0);
