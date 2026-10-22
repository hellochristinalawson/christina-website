"""Refresh the blog block in index.html with the latest posts from The Perspective Papers.

Rewrites only what sits between <!-- posts:start --> and <!-- posts:end -->.
Run by scripts/mac-updater.sh every 3 hours; safe to run by hand: python3 scripts/update_posts.py
"""

import html
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

API = "https://perspectivepapers.substack.com/api/v1/posts?limit=3"
RSS = "https://perspectivepapers.substack.com/feed"
PAGE = Path(__file__).resolve().parent.parent / "index.html"
START, END = "<!-- posts:start -->", "<!-- posts:end -->"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    "Accept": "application/json, application/rss+xml, application/xml;q=0.9, */*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
}


def get(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=30) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        # Say who refused and why, so a blocked run is easy to diagnose from the Actions log
        clues = {k: error.headers.get(k) for k in ("server", "cf-mitigated", "cf-ray") if error.headers.get(k)}
        print(f"{url} -> HTTP {error.code} {clues}")
        raise


def from_rss(raw):
    """Same fields as the API, read from the RSS feed (title, subtitle, link, cover image)."""
    posts = []
    for item in ET.fromstring(raw).iter("item"):
        enclosure = item.find("enclosure")
        posts.append({
            # The feed's text arrives with entities such as &#8217; still encoded
            "title": html.unescape(item.findtext("title", "")),
            "subtitle": html.unescape(item.findtext("description", "")),
            "canonical_url": item.findtext("link", ""),
            "cover_image": enclosure.get("url") if enclosure is not None else None,
        })
    return posts[:3]


def fetch_posts():
    # Substack sometimes refuses its API to servers such as GitHub's, so fall back to the RSS feed
    try:
        return json.loads(get(API))
    except Exception as error:
        print(f"API unavailable ({error}); trying the RSS feed.")
        return from_rss(get(RSS))


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
