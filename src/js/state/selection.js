/**
 * Tiny pub/sub store keeping color / size / quantity in sync between the
 * color selector, the order form and any future component.
 * Values persist across section navigation and are never reset on scroll.
 */
import { COLORS, PRICING, SIZES } from '../config.js';

const STORAGE_KEY = 'shoe-selection-v1';

function persisted() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

const saved = persisted();

// Default to grey: it is the shoe color shown throughout the cinematic
// story, so the handoff into the color selector stays visually continuous.
const DEFAULT_COLOR = 'grey';

const state = {
  color: COLORS.some((c) => c.id === saved.color) ? saved.color : DEFAULT_COLOR,
  size: SIZES.includes(saved.size) ? saved.size : null,
  quantity:
    Number.isInteger(saved.quantity) &&
    saved.quantity >= PRICING.minQty &&
    saved.quantity <= PRICING.maxQty
      ? saved.quantity
      : 1,
};

const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — selection still works in memory */
  }
}

export const selection = {
  get color() {
    return state.color;
  },
  get size() {
    return state.size;
  },
  get quantity() {
    return state.quantity;
  },
  get total() {
    return state.quantity * PRICING.currentPrice;
  },
  setColor(color) {
    if (!COLORS.some((c) => c.id === color) || state.color === color) return;
    state.color = color;
    persist();
    emit();
  },
  setSize(size) {
    if (!SIZES.includes(size) || state.size === size) return;
    state.size = size;
    persist();
    emit();
  },
  setQuantity(qty) {
    const n = Number(qty);
    const safe = Number.isFinite(n) ? Math.round(n) : PRICING.minQty;
    const q = Math.min(
      PRICING.maxQty,
      Math.max(PRICING.minQty, safe),
    );
    if (q === state.quantity) return;
    state.quantity = q;
    persist();
    emit();
  },
  subscribe(fn) {
    listeners.add(fn);
    fn(state);
    return () => listeners.delete(fn);
  },
};

function emit() {
  listeners.forEach((fn) => fn({ ...state }));
}
