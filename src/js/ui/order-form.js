import {
  COLORS,
  SIZES,
  PRICING,
  ORDER_ENDPOINT,
  formatDZD,
} from '../config.js';
import { WILAYAS } from '../data/wilayas.js';
import { selection } from '../state/selection.js';
import { $, $$ } from '../utils/dom.js';

const QUEUE_KEY = 'shoe-orders-v1';

const PHONE_RE = /^(\+?213|0)(5|6|7)\d{8}$/;

const ERRORS = {
  name: 'الرجاء إدخال الاسم واللقب (3 أحرف على الأقل).',
  phone: 'رقم الهاتف غير صحيح. مثال: 06 12 34 56 78',
  wilaya: 'الرجاء اختيار الولاية.',
  address: 'الرجاء إدخال البلدية أو عنوان واضح (4 أحرف على الأقل).',
  color: 'الرجاء اختيار لون الحذاء.',
  size: 'الرجاء اختيار المقاس.',
};

export function initOrderForm() {
  const form = $('#order-form');
  const panel = $('#order-panel');
  const result = $('#order-result');
  const resultInner = $('#order-result-inner');
  const submitBtn = $('#submit-btn');
  const submitLabel = $('#submit-label');
  const spinner = $('.cta__spinner', submitBtn);

  /* ---------------- wilayas (all 58, official order) ---------------- */
  const wilayaSelect = $('#f-wilaya');
  WILAYAS.forEach((w) => {
    const opt = document.createElement('option');
    opt.value = String(w.code);
    opt.textContent = `${w.code} — ${w.name}`;
    wilayaSelect.appendChild(opt);
  });

  /* ---------------- color + size segmented controls ---------------- */
  const colorGroup = $('#form-color');
  colorGroup.innerHTML = COLORS.map(
    (c) => `
      <button type="button" class="seg-btn" role="radio" aria-checked="false"
        data-color="${c.id}">
        <span class="seg-dot" style="background:${c.swatch}"></span>${c.label}
      </button>`,
  ).join('');

  const sizeGroup = $('#form-size');
  sizeGroup.innerHTML = SIZES.map(
    (s) => `
      <button type="button" class="seg-btn" role="radio" aria-checked="false"
        data-size="${s}">${s}</button>`,
  ).join('');

  const colorBtns = $$('.seg-btn', colorGroup);
  const sizeBtns = $$('.seg-btn', sizeGroup);

  colorBtns.forEach((btn) =>
    btn.addEventListener('click', () => selection.setColor(btn.dataset.color)),
  );
  sizeBtns.forEach((btn) =>
    btn.addEventListener('click', () => selection.setSize(Number(btn.dataset.size))),
  );

  /* ---------------- quantity ---------------- */
  const qtyInput = $('#f-qty');
  $('#qty-stepper').addEventListener('click', (e) => {
    const action = e.target.closest('[data-qty]')?.dataset.qty;
    if (!action) return;
    const delta = action === 'inc' ? 1 : -1;
    selection.setQuantity(selection.quantity + delta);
  });
  qtyInput.addEventListener('change', () =>
    selection.setQuantity(Number(qtyInput.value)),
  );

  /* ---------------- render from the single source of truth ---------------- */
  $('#price-original').textContent = formatDZD(PRICING.originalPrice);
  $('#price-save').textContent = `وفّر ${formatDZD(PRICING.savings)}`;

  function render(state) {
    colorBtns.forEach((b) => {
      const on = b.dataset.color === state.color;
      b.classList.toggle('is-selected', on);
      b.setAttribute('aria-checked', String(on));
    });
    sizeBtns.forEach((b) => {
      const on = Number(b.dataset.size) === state.size;
      b.classList.toggle('is-selected', on);
      b.setAttribute('aria-checked', String(on));
    });
    if (Number(qtyInput.value) !== state.quantity) qtyInput.value = state.quantity;
    $('#price-total').textContent = formatDZD(state.quantity * PRICING.currentPrice);
  }
  selection.subscribe(render);

  /* ---------------- validation ---------------- */
  function setError(name, message) {
    const field = form.querySelector(`[data-error-for="${name}"]`)?.closest('.field');
    const errorEl = form.querySelector(`[data-error-for="${name}"]`);
    if (!field || !errorEl) return;
    field.classList.toggle('has-error', Boolean(message));
    errorEl.textContent = message || '';
    field
      .querySelectorAll('input, select, button')
      .forEach((el) => el.setAttribute('aria-invalid', message ? 'true' : 'false'));
  }

  ['input', 'change'].forEach((evt) =>
    form.addEventListener(evt, (e) => {
      const name = e.target.name;
      if (name && form.querySelector(`[data-error-for="${name}"]`)) setError(name, '');
      if (e.target.closest('#form-color')) setError('color', '');
      if (e.target.closest('#form-size')) setError('size', '');
    }),
  );

  function validate(values) {
    const errors = {};
    if (!values.name || values.name.trim().length < 3) errors.name = ERRORS.name;
    const phone = (values.phone || '').replace(/[\s\-()]/g, '');
    if (!PHONE_RE.test(phone)) errors.phone = ERRORS.phone;
    if (!values.wilaya) errors.wilaya = ERRORS.wilaya;
    if (!values.address || values.address.trim().length < 4) errors.address = ERRORS.address;
    if (!COLORS.some((c) => c.id === values.color)) errors.color = ERRORS.color;
    if (!SIZES.includes(Number(values.size))) errors.size = ERRORS.size;
    return errors;
  }

  /* ---------------- result panel ---------------- */
  function showResult(kind, title, message, payload) {
    const icon =
      kind === 'ok' ? '✓' : kind === 'err' ? '!' : 'i';
    const colorLabel = COLORS.find((c) => c.id === payload.color)?.label ?? payload.color;
    const wilaya = WILAYAS.find((w) => String(w.code) === String(payload.wilaya));
    resultInner.innerHTML = `
      <div class="result-icon result-icon--${kind}">${icon}</div>
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="order-summary">
        <div><span>الاسم</span><b>${payload.name}</b></div>
        <div><span>الهاتف</span><b dir="ltr">${payload.phone}</b></div>
        <div><span>الولاية</span><b>${wilaya ? `${wilaya.code} — ${wilaya.name}` : payload.wilaya}</b></div>
        <div><span>اللون / المقاس</span><b>${colorLabel} / ${payload.size}</b></div>
        <div><span>الكمية</span><b>${payload.quantity}</b></div>
        <div><span>المجموع</span><b>${formatDZD(payload.total)}</b></div>
      </div>`;
    form.hidden = true;
    result.hidden = false;
    panel.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  $('#order-again').addEventListener('click', () => {
    result.hidden = true;
    form.hidden = false;
    setSubmitting(false);
  });

  function setSubmitting(on) {
    submitBtn.disabled = on;
    submitLabel.textContent = on ? 'جارٍ إرسال الطلب…' : 'إتمام الطلب';
    spinner.hidden = !on;
  }

  async function postOrder(payload) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(ORDER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => ({}));
      return data.ok !== false;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  /* ---------------- submit ---------------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return; // duplicate-submission guard

    const els = form.elements;
    const values = {
      name: els.name.value.trim(),
      phone: els.phone.value.trim(),
      wilaya: els.wilaya.value,
      address: els.address.value.trim(),
      color: selection.color,
      size: selection.size,
      quantity: selection.quantity,
      hp: els.hp.value,
    };

    // clear stale errors from a previous attempt before re-validating
    $$('.field__error', form).forEach((el) => setError(el.dataset.errorFor, ''));
    const errors = validate(values);
    Object.entries(errors).forEach(([name, msg]) => setError(name, msg));
    if (Object.keys(errors).length) {
      const firstInvalid = form.querySelector('.has-error input, .has-error select, .has-error .seg-btn');
      firstInvalid?.focus();
      return;
    }
    if (values.hp) return; // silent honeypot drop
    values.hp = undefined;

    const payload = {
      ...values,
      hp: undefined,
      total: selection.total,
      ts: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      if (ORDER_ENDPOINT) {
        const ok = await postOrder(payload);
        if (ok) {
          showResult(
            'ok',
            'تم استلام طلبك بنجاح',
            'سنتصل بك على رقم الهاتف لتأكيد الطلب وتفاصيل التوصيل.',
            payload,
          );
          form.reset();
          return;
        }
        throw new Error('server rejected');
      }

      // No backend configured: record locally and state this honestly.
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      queue.push(payload);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      showResult(
        'info',
        'تم تجهيز طلبك — خدمة الإرسال غير مفعّلة بعد',
        'لا يوجد خادم لاستقبال الطلبات حالياً، لذلك لم يتم إرسال أي طلب فعلي. تم حفظ بياناتك على هذا الجهاز فقط، وستُرسل تلقائياً بمجرد ربط نظام الطلبات.',
        payload,
      );
    } catch (err) {
      showResult(
        'err',
        'تعذّر إرسال الطلب',
        'حدث خطأ في الاتصال. بياناتك محفوظة في النموذج، يرجى المحاولة مرة أخرى.',
        payload,
      );
    } finally {
      setSubmitting(false);
    }
  });
}
