export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

export const reducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
export const isMobileMQ = window.matchMedia('(max-width: 640px)');

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export const easeInOut = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/** Map a value across a fade window → 0..1, clamped. */
export function smoothstep(edge0, edge1, x) {
  if (edge1 === edge0) return x >= edge1 ? 1 : 0;
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function scrollToY(y) {
  window.scrollTo({
    top: y,
    behavior: reducedMotionMQ.matches ? 'auto' : 'smooth',
  });
}
