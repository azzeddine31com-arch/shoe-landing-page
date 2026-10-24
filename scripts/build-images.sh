#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Image optimization pipeline (ImageMagick + libwebp).
# Originals in the repo are never modified; optimized files go to public/.
# -----------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=public/assets/img
mkdir -p "$OUT/colors" "$OUT/form" "$OUT/stills"

echo "→ Hero (WebP, 1080w)"
convert "Main video/Hero section.png" -resize 1080x -strip \
  -quality 82 -define webp:method=6 "$OUT/hero.webp"

echo "→ Color section: backgrounds (1280w) + thumbnails (320w, alpha)"
for c in black blue grey; do
  convert "Color section/Bg $c.webp" -resize 1280x -strip \
    -quality 76 -define webp:method=6 "$OUT/colors/bg-$c.webp"
  convert "Color section/Th $c.webp" -resize 320x -strip \
    -quality 88 -define webp:alpha-quality=90 -define webp:method=6 \
    "$OUT/colors/th-$c.webp"
done

echo "→ Form decorative layers (alpha preserved)"
convert "Form/Background.png" -resize 1080x -strip \
  -quality 78 -define webp:method=6 "$OUT/form/bg.webp"
convert "Form/form frame.png" -resize 760x -strip \
  -quality 88 -define webp:alpha-quality=95 -define webp:method=6 \
  "$OUT/form/frame.webp"
convert "Form/Price bg.png" -resize 900x -strip \
  -quality 88 -define webp:alpha-quality=95 -define webp:method=6 \
  "$OUT/form/price-bg.webp"
convert "Form/Button texture.png" -resize 720x -strip \
  -quality 90 -define webp:alpha-quality=95 -define webp:method=6 \
  "$OUT/form/button-texture.webp"
convert "Form/bottom_watermark_crop.png" -resize 450x -strip \
  -quality 90 -define webp:alpha-quality=95 "$OUT/form/watermark.webp"

echo "→ Done. Output sizes:"
find "$OUT" -type f \( -name '*.webp' -o -name '*.jpg' \) -printf '%k KB  %p\n' | sort -k3
