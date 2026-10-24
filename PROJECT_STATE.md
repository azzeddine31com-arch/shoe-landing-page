# PROJECT_STATE.md — Cinematic Safety Shoe Landing Page (Algeria)

> Living document, updated each engineering loop. Last update: Loop 1 (Discovery) complete.

## 1. Project context

- Repo started as **assets-only** (no `index.html`, no framework, no build config).
- Target: single cinematic, Arabic-first (RTL), mobile-first landing page deployable to **Cloudflare Pages** (GitHub-connected).
- Chosen stack (no existing architecture to preserve): **Vite + vanilla ES modules + GSAP/ScrollTrigger**, single scroll engine, no competing animation libraries.
- Sandbox note: npm postinstall binary downloads from `release-assets.githubusercontent.com` are blocked here; media tooling uses Python `PyAV` (libx264) + ImageMagick instead of ffmpeg CLI.

## 2. Verified asset inventory

### 2.1 Main videos — `Main video/Video 1..11.mp4`

All clips: **HEVC/H.265, 2160×3840 (9:16), 60 fps, no audio, ~28–37 Mbps**. HEVC is not reliably playable in Chrome/Android → transcode to H.264 mandatory.

| # | Frames | Dur (s) | Visual content (verified from extracted frames) | Narrative role |
|---|--------|---------|--------------------------------------------------|----------------|
| 1 | 97 | 1.62 | Full shoe floating in light beam → push-in to BOA-style rotary dial | Hero / craft intro |
| 2 | 122 | 2.03 | Dial macro → cable lacing weave → torn-upper reveal of steel toe cap, sparks | Steel-toe protection |
| 3 | 74 | 1.23 | Steel toe hold → rotate to outsole tread → shoe steps onto bed of rusty nails | Sole / hazard ground |
| 4 | 122 | 2.03 | Stomp on nails, sparks → nail approaches sole → cross-section: nail blocked by yellow woven anti-puncture layer | Puncture protection |
| 5 | 122 | 2.03 | Layer holds nail out → shoe lifted → sole touches wet reflective floor, ripples | Grip / wet stability |
| 6 | 122 | 2.03 | Wet ripples → heel counter → push into collar opening, glowing insole | Interior / comfort intro |
| 7 | 152 | 2.53 | Macro journey through foam/honeycomb structure → neon portal | Cushioning / abstract comfort |
| 8 | 122 | 2.03 | Travel through portal → shoe emerges in dark wireframe showroom | Reassembly / construction |
| 9 | 122 | 2.03 | Light sweeps → blueprint board with orthographic sketches + polaroid detail | Engineering / details |
| 10 | 122 | 2.03 | Blueprint → exploded view (upper, insole, yellow midsole, outsole separate) | Construction layers |
| 11 | 163 | 2.72 | Exploded layers → shoe lands with dust → lifestyle shot, model wearing it, torn-paper graffiti styling | Closure → handoff to color section |

Total ≈ **22.3 s, 1218 frames**. Clip boundaries are visually continuous (each opens on the previous clip's closing subject) → safe to concatenate into one scrubbed video.

### 2.2 Images

- `Main video/Hero section.png` — 3072×5504, matches Video 1 opening frame (shoe in light beam, dark navy).
- `Color section/` — 3 variants × `Bg` (3072×5504 poster: model + colored shoe, torn-paper street art; JPG 3.4–8 MB, WebP 0.67–0.78 MB) and `Th` (polaroid-style color swatch, ~788×1033 PNG / ~21–30 KB WebP). Variants: **black, blue, grey**.
- `Form/` — all verified: `Background.png` (1536×2752 opaque dark marble), `form frame.png` (1129×2470 **alpha**, torn-paper frame), `Price bg.png` (1854×640 alpha, cream torn paper), `Button texture.png` (1528×287 alpha, light marble), `Order now.png` (492×269 alpha, Arabic calligraphy "طلب الآن"), plus watermark/test crops. `form full design.png` is the flattened reference only — not to be embedded.
- Reference-only (never embedded): `example website.mp4` (63.5 s, third-party cinematic scroll inspiration), `cta button example.mp4` (11.2 s, glowing outlined CTA inspiration).

## 3. Architecture decisions

1. **Scroll engine:** single concatenated H.264 MP4 scrubbed via one GSAP ScrollTrigger (pin + scrub) and one rAF loop easing `video.currentTime` toward scroll-derived target. Rejected: 11 parallel `<video>` elements (decoder/memory), image sequence (1218 frames, request overhead).
2. **Two video tiers** selected at runtime: desktop 1080×1920 / mobile 720×1280, 30 fps, yuv420p, faststart, capped GOP for seek responsiveness.
3. **Reduced motion / no autoplay support:** chapter still frames with simple crossfades; all content and forms remain fully usable.
4. **Fonts:** self-hosted via Fontsource — Tajawal (UI/body) + Cairo (display), `font-display: swap`. No runtime CDN dependency.
5. **Form:** real HTML controls layered over supplied decorative PNGs; single pricing source of truth in `config.js`; 58 wilayas in data module; endpoint configurable — no fake success state.
6. Originals stay in repo untouched; optimized assets are generated into `public/assets/`.

## 4. Planned chapter structure (5 chapters, mapped to footage)

1. التفاصيل تصنع الفرق — V1 (craft/dial)
2. الصدمات الخطيرة تبدأ من هنا — V2 + V3 start (steel toe)
3. امشي فوق المسامير بأمان / ثبات أكثر في ظروف العمل — V3 end + V4 + V5 (puncture layer, wet grip)
4. حماية وراحة في كل خطوة — V6 + V7 (interior, cushioning)
5. كل جزء يخدم مع الآخر — V8–V11 (blueprint, exploded layers, lifestyle close → color section)

## 5. Claim verification status

- Steel toe cap, anti-puncture woven layer, tread/grip, cushioning layers: **visually depicted in supplied footage** → feature labels allowed, phrased descriptively, no standards/certification claims (no EN ISO 20345 data supplied).
- COD payment, delivery times, weight: **unverified** → FAQ uses verification-aware wording.
- Prices: supplied (4,800 / 2,900 / savings 1,900 DZD). Shipping fee not supplied → not invented.

## 6. Bugs / limitations / open questions

- No backend/order endpoint exists → integration point documented in `src/js/config.js`.
- Real-device testing limited in sandbox; logic gets Node smoke tests, build + preview get HTTP checks.
- Cloudflare deployment cannot be performed without account access; build will be deployment-ready.

## 7. Loop log

- [x] Loop 1 Discovery: repo, metadata, storyboards, references, tooling, plan.
- [x] Loop 2 Cinematic prototype: single concatenated H.264 video + rAF/eased `currentTime` scrubber; forward/reverse and range-request (HTTP 206) verified.
- [x] Loop 3 Story integration: 5 chapters / 6 text beats from manifest timing, Arabic captions, feature callouts, chapter dots, progress bar; all 10 clip boundaries verified seamless frame-by-frame.
- [x] Loop 4 Color selector: cross-faded WebP posters, polaroid thumbs, arrow-key radiogroup, two-way store sync, grey default matching the final film frame.
- [x] Loop 5 Order form: real HTML over supplied decorative PNG layers, 58 wilayas, sizes 40–45, qty stepper, single-source pricing (4.800/2.900/وفّر 1.900), Algerian phone validation, stale-error clearing, honeypot, duplicate-submit guard, honest no-backend state + `ORDER_ENDPOINT` integration point.
- [x] Loop 6 FAQ + responsive: accessible accordion (ARIA, keyboard, grid animation), RTL throughout, 560/480/420vh story lengths, reduced-motion still-frame fallback, no-JS noscript fallback.
- [x] Loop 7 Verification: 20 jsdom smoke tests pass, production build clean, all asset routes 200, video range requests 206, fonts/woff2 resolve, no console-blocking module errors.

## 8. Build outputs and performance

- `public/assets/video/story-desktop.mp4` — H.264 high@4.1, 1080×1920, 30 fps, faststart, 2 s GOP, **13.0 MB**.
- `public/assets/video/story-mobile.mp4` — 720×1280, **6.9 MB** (chosen at runtime via media query, single tier loaded).
- Images: hero 104 KB, color posters 180–224 KB each (lazy), thumbnails 8–12 KB, form layers 12–84 KB; all WebP with alpha preserved. Originals (HEVC 110 MB, PNG/JPG ~45 MB) retained in repo, never shipped.
- JS: app chunk **27.8 KB gzip** + GSAP **27.8 KB gzip** (manualChunks split); CSS 5.6 KB gzip; Arabic-only Tajawal/Cairo woff2 subsets, `font-display: swap`.
- Caching headers for Cloudflare Pages in `public/_headers`.

## 9. Tests / verification record

- `npm run test:logic` — 20/20 pass (data integrity, manifest continuity, chapter/beat math, scrubber lifecycle, form validation incl. phone regex, qty NaN guards, pricing, two-way color sync, honeypot, FAQ ARIA).
- `npm run build` — succeeds; 48 files in `dist/`, ~23 MB (dominated by the two video tiers; only one is loaded per device).
- HTTP checks against dev + preview servers: every referenced asset 200, video supports 206 range, fonts resolve to woff2.
- **Not performed (no reachable browser in sandbox):** real-device scroll/touch scrubbing, visual QA of GSAP timelines, Lighthouse, memory profiling. Logic is covered by tests; engine follows the standard GSAP ScrollTrigger + rAF seek pattern with a 12 s safety fallback to still frames.

## 10. Remaining owner decisions

1. Set `ORDER_ENDPOINT` in `src/js/config.js` (or confirm the localStorage-queue interim is acceptable).
2. Confirm COD coverage by wilaya and real delivery windows for FAQ wording.
3. Confirm any safety standard/certification numbers before adding them; current copy is descriptive only.
4. Optional: provide actual product weight and a size chart.
5. Connect Cloudflare Pages (build `npm run build`, output `dist/`) — cannot be performed from this sandbox.
