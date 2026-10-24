#!/usr/bin/env python3
"""
Media build pipeline (PyAV + libx264).

- Concatenates the 11 source HEVC clips (continuous visual sequence) into ONE
  H.264/H.264 mp4 per quality tier, 30 fps, yuv420p, faststart, capped GOP.
- Emits src/js/data/media-manifest.json with verified clip timing.
- Extracts chapter still frames (used by reduced-motion mode and posters).

Run: /tmp/venv/bin/python scripts/build-media.py
"""
import json
import os
from fractions import Fraction

import av
import cv2

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(REPO, "Main video")
OUT_VIDEO = os.path.join(REPO, "public", "assets", "video")
OUT_STILLS = os.path.join(REPO, "public", "assets", "img", "stills")
MANIFEST = os.path.join(REPO, "src", "js", "data", "media-manifest.json")
FPS_OUT = 30

# (width, height, crf, maxrate, bufsize, filename)
TIERS = [
    (1080, 1920, "24", "4500k", "9000k", "story-desktop.mp4"),
    (720, 1280, "26", "2400k", "4800k", "story-mobile.mp4"),
]

# Chapter still points: (id, clip_index 1-based, fraction inside clip)
STILL_POINTS = [
    ("ch1-intro", 1, 0.15),
    ("ch1-dial", 1, 0.92),
    ("ch2-lacing", 2, 0.35),
    ("ch2-toe", 2, 0.90),
    ("ch3-nails", 3, 0.85),
    ("ch3-layer", 4, 0.85),
    ("ch3-grip", 5, 0.80),
    ("ch4-insole", 6, 0.75),
    ("ch4-foam", 7, 0.45),
    ("ch5-showroom", 8, 0.80),
    ("ch5-blueprint", 9, 0.75),
    ("ch5-exploded", 10, 0.80),
    ("ch5-lifestyle", 11, 0.85),
    ("final-frame", 11, 0.99),
]


def probe_clips():
    clips = []
    for i in range(1, 12):
        path = os.path.join(SRC_DIR, f"Video {i}.mp4")
        cap = cv2.VideoCapture(path)
        n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        cap.release()
        clips.append({
            "index": i,
            "file": f"Main video/Video {i}.mp4",
            "frames": n,
            "srcFps": round(fps, 3),
            "width": w,
            "height": h,
            "duration": round(n / fps, 4),
        })
    offset = 0.0
    for c in clips:
        c["start"] = round(offset, 4)
        offset += c["duration"]
        c["end"] = round(offset, 4)
    return clips, round(offset, 4)


def encode_tier(clips, width, height, crf, maxrate, bufsize, filename):
    os.makedirs(OUT_VIDEO, exist_ok=True)
    out_path = os.path.join(OUT_VIDEO, filename)
    container = av.open(out_path, "w", format="mp4",
                        options={"movflags": "+faststart"})
    stream = container.add_stream("libx264", rate=FPS_OUT, options={
        "crf": crf,
        "preset": "slow",
        "maxrate": maxrate,
        "bufsize": bufsize,
        "g": "60",
        "keyint_min": "30",
        "profile:v": "high",
        "level": "4.1",
        "pix_fmt": "yuv420p",
    })
    stream.width = width
    stream.height = height
    stream.pix_fmt = "yuv420p"
    stream.time_base = Fraction(1, FPS_OUT)

    out_pts = 0
    next_slot = 0.0
    slot = 1.0 / FPS_OUT
    total_in = 0
    for clip in clips:
        src = av.open(os.path.join(SRC_DIR, f"Video {clip['index']}.mp4"))
        vstream = src.streams.video[0]
        in_idx = 0
        for frame in src.decode(vstream):
            t = clip["start"] + in_idx / clip["srcFps"]
            in_idx += 1
            if t + 1e-6 >= next_slot:
                rf = frame.reformat(width=width, height=height,
                                    format="yuv420p")
                rf.pts = out_pts
                rf.time_base = Fraction(1, FPS_OUT)
                for pkt in stream.encode(rf):
                    container.mux(pkt)
                out_pts += 1
                next_slot += slot
        total_in += in_idx
        src.close()
        print(f"  {filename}: clip {clip['index']} done ({in_idx} frames)")
    for pkt in stream.encode():
        container.mux(pkt)
    container.close()
    size_mb = os.path.getsize(out_path) / 1e6
    print(f"  -> {out_path}  {out_pts} frames, {size_mb:.2f} MB")
    return size_mb


def extract_stills(clips, desktop_video):
    os.makedirs(OUT_STILLS, exist_ok=True)
    cap = cv2.VideoCapture(desktop_video)
    out_fps = cap.get(cv2.CAP_PROP_FPS)
    manifest_stills = []
    for sid, clip_idx, frac in STILL_POINTS:
        clip = clips[clip_idx - 1]
        t = clip["start"] + clip["duration"] * frac
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ok, img = cap.read()
        if not ok:
            print(f"  STILL FAILED: {sid}")
            continue
        img = cv2.resize(img, (720, 1280), interpolation=cv2.INTER_AREA)
        path = os.path.join(OUT_STILLS, f"{sid}.jpg")
        cv2.imwrite(path, img, [cv2.IMWRITE_JPEG_QUALITY, 86])
        manifest_stills.append({"id": sid, "time": round(t, 3),
                                "src": f"/assets/img/stills/{sid}.jpg"})
    cap.release()
    return manifest_stills


def main():
    print("Probing source clips...")
    clips, total = probe_clips()
    print(f"  {len(clips)} clips, total {total:.2f}s")

    sizes = {}
    for tier in TIERS:
        print(f"Encoding {tier[-1]} ({tier[0]}x{tier[1]})...")
        sizes[tier[-1]] = round(encode_tier(clips, *tier), 2)

    print("Extracting chapter stills...")
    stills = extract_stills(clips, os.path.join(OUT_VIDEO, TIERS[0][-1]))

    manifest = {
        "generatedBy": "scripts/build-media.py",
        "fps": FPS_OUT,
        "totalDuration": total,
        "video": {
            "desktop": "/assets/video/story-desktop.mp4",
            "mobile": "/assets/video/story-mobile.mp4",
            "sizesMb": sizes,
        },
        "stills": stills,
        "clips": clips,
    }
    os.makedirs(os.path.dirname(MANIFEST), exist_ok=True)
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"Manifest written: {MANIFEST}")


if __name__ == "__main__":
    main()
