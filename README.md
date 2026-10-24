# صباط الخدمة — Cinematic Safety Shoe Landing Page

Arabic-first (RTL), mobile-first cinematic landing page for protective work
shoes, aimed at the Algerian market. Built with **Vite + vanilla ES modules +
GSAP ScrollTrigger** — no framework, a single scroll engine.

## Experience

1. **Cinematic hero** — hero still + masked Arabic headline and glowing CTA.
2. **Scroll-scrubbed story** — the 11 supplied clips are concatenated into one
   H.264 video and driven directly by scroll (forward and reverse), with five
   synced Arabic chapters and feature callouts.
3. **Color selector** — black / blue / grey, cross-faded posters with polaroid
   thumbnails, synchronized two-way with the order form.
4. **Order form** — real HTML controls over the supplied decorative layers:
   name, Algerian phone validation, all 58 wilayas, address, color, sizes
   40–45, quantity stepper, single-source pricing, field-level validation.
5. **FAQ** — accessible accordion with verification-aware answers.

Reduced-motion / video-failure mode replaces scrubbing with representative
still frames and keeps every feature usable.

## Commands

```bash
npm install
npm run dev          # local dev server
npm run build        # production build → dist/
npm run preview      # serve the production build
npm run test:logic   # jsdom smoke tests (data, form, selector, FAQ)
```

### Media pipeline (already run; outputs are committed in `public/assets/`)

```bash
/tmp/venv/bin/python scripts/build-media.py   # PyAV: HEVC clips → H.264 tiers + stills + manifest
bash scripts/build-images.sh                  # ImageMagick: optimized WebP layers
```

- `public/assets/video/story-desktop.mp4` — 1080×1920, ~13 MB
- `public/assets/video/story-mobile.mp4` — 720×1280, ~6.9 MB
- Source HEVC clips in `Main video/` are retained untouched.

## Order backend

No backend is connected. `src/js/config.js → ORDER_ENDPOINT` is the single
integration point:

- empty (default): the form validates, stores the payload in
  `localStorage` (`shoe-orders-v1`) and shows an explicit "service not
  connected yet" notice — it never fakes a successful order;
- set to a URL: `POST {name, phone, wilaya, address, color, size, quantity,
  total, ts, hp}` and a JSON `{ "ok": true }` shows the real success state.

## Deployment (Cloudflare Pages)

- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- No environment variables required; no secrets are shipped to the client.
- Cache headers are declared in `public/_headers`.

## Content integrity

No safety standards, certifications, weight, delivery-time or COD claims are
published without verification. See `PROJECT_STATE.md` section 5 for the
current claim-verification status and the open items for the project owner.
