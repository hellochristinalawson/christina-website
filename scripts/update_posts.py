"""Refresh the blog block in index.html with the latest posts from The Perspective Papers.

Rewrites only what sits between <!-- posts:start --> and <!-- posts:end -->.
Run by .github/workflows/update-posts.yml; safe to run by hand: python3 scripts/update_posts.py
"""

import html
import json
import re
import sys
import urllib.request
from pathlib import Path

FEED = "https://perspectivepapers.substack.com/api/v1/posts?limit=3"
PAGE = Path(__file__).resolve().parent.parent / "index.html"
START, END = "<!-- posts:start -->", "<!-- posts:end -->"


def fetch_posts():
    request = urllib.request.Request(FEED, headers={"User-Agent": "christinalawson.com post updater"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def card(post):
    url = html.escape(post["canonical_url"], quote=True)
    title = html.escape(post["title"].strip())
    summary = html.escape((post.get("subtitle") or post.get("description") or "").strip())
    image = ""
    if post.get("cover_image"):
        # Substack image URLs end in _<width>x<height>.<ext>; fall back to a 4:3 hint
        size = re.search(r"_(\d+)x(\d+)\.\w+$", post["cover_image"])
        width, height = size.groups() if size else ("1200", "900")
        image = (
            f'              <img class="post__image" src="{html.escape(post["cover_image"], quote=True)}" '
            f'width="{width}" height="{height}" loading="lazy" decoding="async" alt="">\n'
        )
    summary_line = f'                <span class="post__summary">{summary}</span>\n' if summary else ""
    return (
        "          <li>\n"
        f'            <a class="post" href="{url}" target="_blank" rel="noopener">\n'
        f"{image}"
        '              <span class="post__body">\n'
        f'                <span class="post__title">{title}</span>\n'
        f"{summary_line}"
        "              </span>\n"
        "            </a>\n"
        "          </li>\n"
    )


def main():
    posts = fetch_posts()
    if not posts:
        sys.exit("No posts returned; leaving the page unchanged.")
    page = PAGE.read_text(encoding="utf-8")
    before, rest = page.split(START, 1)
    _, after = rest.split(END, 1)
    block = START + "\n" + "".join(card(post) for post in posts) + "          " + END
    updated = before + block + after
    if updated == page:
        print("Posts already up to date.")
        return
    PAGE.write_text(updated, encoding="utf-8")
    print("Updated posts:", ", ".join(post["title"] for post in posts))


if __name__ == "__main__":
    main()
