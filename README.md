# OBIDER — Arabic RTL scroll-story landing page

A single-page, self-contained landing page (HTML + CSS + vanilla JS). **No build step, no dependencies, no framework** — `index.html` is the site.

```
.
├── index.html                 ← the whole page (markup, CSS and JS inline)
├── _headers                   ← Cloudflare Pages cache/security headers
├── Color section/
│   ├── assets/                ← three collage frames used by the colour scene (webp)
│   └── Bg *.webp              ← full-resolution masters (not referenced by the page)
├── Form/assets/               ← torn paper frame, price ticket, button texture…
├── Main video/
│   ├── hero-1080.webp / hero-1440.webp   ← hero poster (srcset, 1080w / 1440w)
│   ├── transitions/           ← 11 × forward + reverse clips + section anchors
│   └── Video 1…11.mp4         ← source clips the transitions were cut from (not referenced)
├── tools/check-assets.py      ← verifies every reference resolves, case-sensitively
├── cta button example.mp4     ← design reference (not referenced)
└── example website.mp4        ← design reference (not referenced)
```

## Deploy on Cloudflare Pages

**Option A — Git integration (recommended)**

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick the repository `azzeddine31com-arch/shoe-landing-page`.
3. Use exactly these build settings:

   | Setting | Value |
   |---|---|
   | Framework preset | **None** |
   | Build command | *(leave empty)* |
   | Build output directory | `/` |
   | Root directory | *(leave empty)* |
   | Environment variables | *(none)* |

4. Deploy. The production branch is `main`; any other branch (for example `arena/b5a6c73b-shoe-landing-page`) gets its own preview URL, which is the easiest way to check a change before merging.

**Option B — Direct upload**

`npx wrangler pages deploy . --project-name obider` from the repository root (no build command).

## Rules this repo keeps (so the deploy never breaks)

- `index.html` stays at the **repository root** — Pages serves the root directory as the site.
- Every asset path is **relative** (`Form/assets/...`, never `/Form/assets/...`), so the site also works from a sub-path preview.
- Paths are **case-sensitive** and must match the files on disk (`Color section`, `Main video/transitions/transition-01-forward.mp4`). Folder names contain a space, so they are URL-encoded as `%20` in `index.html` — do not rename the folders without updating every reference.
- No `package.json`, bundler, or generated `dist/` folder is required.

Run this after touching any asset path:

```bash
python3 tools/check-assets.py
```

It prints `all references resolve` when every static reference **and** every transition clip listed in the `data-forward` / `data-reverse` / `data-anchor` attributes exists with the exact same case.

## Notes

- Fonts load from Google Fonts (`Alexandria`, `Tajawal`, `Titan One`); everything else is local.
- `_headers` sets long-lived immutable caching for `.webp` / `.mp4` and revalidates `index.html` on every deploy.
- Every image in the project is **WebP** (no PNG/JPEG/AVIF sources are kept); `index.html` never references another image format.
- The repository also keeps design sources and the master video clips (~160 MB). They are **not referenced** by the page; Cloudflare deploys them but never serves them. Delete them if you want faster uploads — `tools/check-assets.py` will confirm nothing breaks.

---

### بالعربية — خطوات النشر

1. من لوحة Cloudflare: **Workers & Pages ← Create ← Pages ← Connect to Git** واختر المستودع.
2. الإعدادات: **Framework preset = None**، **Build command = فارغ**، **Build output directory = `/`**.
3. اضغط Deploy. الفرع `main` هو الإنتاج، وأي فرع آخر يحصل على رابط معاينة خاص به.
4. `index.html` يجب أن يبقى في جذر المستودع، وكل المسارات نسبية وحسّاسة لحالة الأحرف (الفراغات في أسماء المجلدات مكتوبة `%20`). بعد أي تعديل على المسارات شغّل `python3 tools/check-assets.py`.
