#!/usr/bin/env python3
"""Verify every asset referenced by index.html exists with the exact same case.

Cloudflare Pages (and GitHub) serve files from a case-sensitive filesystem, so a
reference like `Form/Assets/Button.webp` silently 404s in production even when it
works on Windows/macOS. This script also checks the paths that index.html builds
at runtime (the transition clips read from the data-* attributes).

Usage:  python3 tools/check-assets.py [root]
Exit code 0 = every reference resolves, 1 = something is missing.
"""

import os
import re
import sys
import urllib.parse

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ".")
INDEX = os.path.join(ROOT, "index.html")
TRANSITIONS = os.path.join("Main video", "transitions")

SKIP_PREFIXES = ("http://", "https://", "#", "data:", "mailto:", "tel:", "javascript:")


def references(html: str) -> set[str]:
    refs: set[str] = set()
    refs.update(m.group(1) for m in re.finditer(r'(?:src|href)="([^"#]+)"', html))
    refs.update(m.group(1) for m in re.finditer(r"url\(['\"]?([^'\")]+)['\"]?\)", html))
    # transition clips and section anchors are resolved in JS from data-* values
    refs.update(
        "%20".join(TRANSITIONS.split(" ")) + "/" + m.group(1)
        for m in re.finditer(r'data-(?:forward|reverse|anchor)="([^"]+)"', html)
    )
    return {r for r in refs if not r.startswith(SKIP_PREFIXES)}


def main() -> int:
    if not os.path.exists(INDEX):
        print(f"index.html not found in {ROOT}")
        return 1

    with open(INDEX, encoding="utf-8") as handle:
        html = handle.read()

    missing = []
    for ref in sorted(references(html)):
        path = urllib.parse.unquote(ref.split("?")[0].split("#")[0])
        if not os.path.exists(os.path.join(ROOT, path)):
            missing.append(ref)

    print(f"checked {len(references(html))} references")
    for ref in missing:
        print(f"  MISSING: {ref}")
    print("all references resolve" if not missing else f"{len(missing)} broken reference(s)")
    return 0 if not missing else 1


if __name__ == "__main__":
    sys.exit(main())
