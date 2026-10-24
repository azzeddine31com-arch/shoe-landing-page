/**
 * Global site configuration.
 * Single source of truth for pricing, order endpoint and breakpoints.
 */

export const PRICING = Object.freeze({
  currency: 'دج',
  originalPrice: 4800,
  currentPrice: 2900,
  get savings() {
    return this.originalPrice - this.currentPrice;
  },
  minQty: 1,
  maxQty: 10,
});

export const SIZES = Object.freeze([40, 41, 42, 43, 44, 45]);

export const COLORS = Object.freeze([
  { id: 'black', label: 'أسود', swatch: '#17181c' },
  { id: 'blue', label: 'أزرق', swatch: '#1d3a8a' },
  { id: 'grey', label: 'رمادي', swatch: '#9a9ca3' },
]);

/**
 * Order backend integration point.
 *
 * Leave EMPTY to run the documented "integration pending" flow:
 * the form still validates every field, stores the order in localStorage
 * and shows an explicit, honest notice — it never fakes a server success.
 *
 * To connect a real backend, set this to a POST endpoint accepting JSON:
 *   { name, phone, wilaya, address, color, size, quantity, total, ts, hp }
 * A JSON response `{ ok: true }` triggers the real success state.
 */
export const ORDER_ENDPOINT = '';

export const BREAKPOINTS = Object.freeze({
  mobile: 640,
  tablet: 1024,
});

export function formatDZD(value) {
  return `${new Intl.NumberFormat('ar-DZ', {
    maximumFractionDigits: 0,
  }).format(value)} ${PRICING.currency}`;
}
