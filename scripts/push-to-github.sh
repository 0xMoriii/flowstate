#!/bin/bash
# Usage: ./scripts/push-to-github.sh https://github.com/YOUR_USERNAME/YOUR_REPO.git
# Or:    ./scripts/push-to-github.sh git@github.com:YOUR_USERNAME/YOUR_REPO.git

set -e
cd "$(dirname "$0")/.."

if [ -z "$1" ]; then
  echo "Usage: $0 <repo-url>"
  echo "Example: $0 https://github.com/yourusername/nextjs-boilerplate-main.git"
  echo ""
  echo "Create the repo first at: https://github.com/new (leave README unchecked)"
  exit 1
fi

REPO_URL="$1"
if git remote get-url origin 2>/dev/null; then
  echo "Remote 'origin' already exists. Updating to $REPO_URL"
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi
git push -u origin main
echo "Done. Your code is on GitHub."
