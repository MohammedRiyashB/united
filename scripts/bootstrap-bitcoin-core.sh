#!/usr/bin/env bash
set -Eeuo pipefail

# Fetches the exact pinned upstream source into a disposable working directory.
# It does NOT patch, rename, or build Bitcoin Core as UNITED.
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOCK_FILE="$ROOT_DIR/core/upstream.lock.toml"
DEST="$1"
if [[ -z "$DEST" ]]; then DEST="$ROOT_DIR/.work/bitcoin-core-v32.1"; fi

read_lock() {
  local key="$1"
  sed -nE "s/^[[:space:]]*$key[[:space:]]*=[[:space:]]*\"([^\"]+)\"[[:space:]]*$/\\1/p" "$LOCK_FILE" | head -n1
}

UPSTREAM="$(read_lock upstream)"
TAG="$(read_lock release_tag)"
EXPECTED_TAG_OBJECT="$(read_lock tag_object)"
EXPECTED_COMMIT="$(read_lock commit)"

if [[ "$UPSTREAM" != "bitcoin/bitcoin" || "$TAG" != "v32.1" || -z "$EXPECTED_TAG_OBJECT" || -z "$EXPECTED_COMMIT" ]]; then
  echo "ERROR: unexpected or incomplete upstream lock: $LOCK_FILE" >&2
  exit 2
fi
if ! command -v git >/dev/null 2>&1; then
  echo "ERROR: git is required" >&2
  exit 2
fi
if [[ -e "$DEST" ]]; then
  echo "ERROR: destination already exists; refusing to overwrite: $DEST" >&2
  exit 2
fi

mkdir -p "$(dirname "$DEST")"
echo "Cloning $UPSTREAM tag $TAG into $DEST"
git clone --no-checkout "https://github.com/$UPSTREAM.git" "$DEST"
cd "$DEST"

ACTUAL_TAG_OBJECT="$(git rev-parse "$TAG^{tag}")"
ACTUAL_COMMIT="$(git rev-parse "$TAG^{commit}")"

if [[ "$ACTUAL_TAG_OBJECT" != "$EXPECTED_TAG_OBJECT" ]]; then
  echo "ERROR: annotated tag object mismatch" >&2
  echo "Expected: $EXPECTED_TAG_OBJECT" >&2
  echo "Actual:   $ACTUAL_TAG_OBJECT" >&2
  exit 3
fi
if [[ "$ACTUAL_COMMIT" != "$EXPECTED_COMMIT" ]]; then
  echo "ERROR: release commit mismatch" >&2
  echo "Expected: $EXPECTED_COMMIT" >&2
  echo "Actual:   $ACTUAL_COMMIT" >&2
  exit 3
fi

# Requires the maintainer's public signing key in the operator's trusted GPG
# keyring. Verify its fingerprint independently first.
if ! git verify-tag "$TAG"; then
  echo "ERROR: signed-tag verification failed. Verify/import the official key." >&2
  echo "Do not bypass this check." >&2
  exit 4
fi

git checkout --detach "$EXPECTED_COMMIT"
printf '\nVerified source checkout:\n'
git show -s --format='commit %H%nsubject %s' HEAD
printf '\nSource path: %s\n' "$DEST"
printf 'No UNITED patch has been applied. This is the pinned upstream tree only.\n'
