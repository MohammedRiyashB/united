#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORKDIR="${1:-$ROOT_DIR/.work/bitcoin-core-v32.1-united}"
BUILD_DIR="$WORKDIR/build"
JOBS="${BUILD_JOBS:-2}"

if [[ -e "$WORKDIR" ]]; then
  echo "ERROR: work directory already exists; refusing to overwrite: $WORKDIR" >&2
  echo "Choose a new path or remove the old disposable checkout yourself." >&2
  exit 2
fi

# This verifies the exact pinned tag/commit and signed tag. It intentionally
# stops if the signing key is not present and trusted in the operator's keyring.
bash "$ROOT_DIR/scripts/bootstrap-bitcoin-core.sh" "$WORKDIR"

git -C "$WORKDIR" apply --check "$ROOT_DIR/core/patches/0001-add-united-regtest.patch"
git -C "$WORKDIR" apply "$ROOT_DIR/core/patches/0001-add-united-regtest.patch"
git -C "$WORKDIR" apply --check "$ROOT_DIR/core/patches/0002-add-united-public-testnet.patch"
git -C "$WORKDIR" apply "$ROOT_DIR/core/patches/0002-add-united-public-testnet.patch"
git -C "$WORKDIR" diff --check

python3 "$ROOT_DIR/scripts/verify-united-testnet-genesis.py"

cmake -S "$WORKDIR" -B "$BUILD_DIR" -G Ninja \
  -DBUILD_TESTS=OFF -DBUILD_BENCH=OFF -DBUILD_GUI=OFF \
  -DBUILD_TX=OFF -DBUILD_UTIL=OFF -DENABLE_WALLET=ON \
  -DENABLE_IPC=OFF -DENABLE_EXTERNAL_SIGNER=OFF \
  -DWITH_ZMQ=OFF -DWITH_USDT=OFF

cmake --build "$BUILD_DIR" --parallel "$JOBS"

printf '\nUNITED native build complete.\n'
printf 'bitcoind: %s\n' "$BUILD_DIR/bin/bitcoind"
printf 'bitcoin-cli: %s\n' "$BUILD_DIR/bin/bitcoin-cli"
printf 'Network: private -chain=unitedregtest | candidate public -chain=unitedtestnet\n'
printf 'Public testnet has no DNS seeds yet; configure a verified -addnode peer manually.\n'
