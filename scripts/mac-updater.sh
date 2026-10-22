#!/bin/bash
# Publishes new Substack posts to the homepage's blog block. Run every 3 hours by launchd
# (~/Library/LaunchAgents/com.christinalawson.update-posts.plist) from its own copy of the site in
# ~/Library/Application Support/ChristinaWebsiteUpdater, because background jobs can't read ~/Documents.
# Substack's Cloudflare blocks GitHub's servers, which is why this runs on the Mac instead.
#
# Run now:   launchctl kickstart gui/$(id -u)/com.christinalawson.update-posts
# Log:       ~/Library/Logs/christina-website-updater.log
# Turn off:  launchctl bootout gui/$(id -u)/com.christinalawson.update-posts
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/bin:/bin"
cd "$(dirname "$0")/.."

echo "== $(date '+%Y-%m-%d %H:%M')"
# This copy only ever holds the updater's own commits, so it's safe to match GitHub exactly
git fetch --quiet origin main
git reset --quiet --hard origin/main

/usr/bin/python3 scripts/update_posts.py
if git diff --quiet; then
  exit 0
fi
git commit --quiet -am "Update blog posts from Substack"
git push --quiet origin HEAD:main
echo "Published new posts."
