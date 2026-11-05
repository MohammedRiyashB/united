#!/usr/bin/env bash
set -euo pipefail

OWNER="MohammedRiyashB"
REPO="united"
FULL_NAME="${OWNER}/${REPO}"
REMOTE="https://github.com/${FULL_NAME}.git"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required. Install it, then run: gh auth login" >&2
  exit 1
fi

gh auth status >/dev/null
gh repo view "$FULL_NAME" >/dev/null

if [ ! -d .git ]; then
  git init -b main
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$REMOTE"
fi

if [ "$(git branch --show-current)" != "main" ]; then
  git branch -M main
fi

git add .
if ! git diff --cached --quiet; then
  git commit -m "Initial UNITED Network engineering scaffold"
fi

# A normal push is intentional: never force-overwrite remote history.
git push -u origin main
echo "Pushed UNITED project to https://github.com/${FULL_NAME}"
