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

# Verifies the exact pinned tag/commit and requires a trusted GPG key.
# Do not bypass signature verification.
bash "$ROOT_DIR/scripts/bootstrap-bitcoin-core.sh" "$WORKDIR"

git -C "$WORKDIR" apply --check "$ROOT_DIR/core/patches/0001-add-united-regtest.patch"
git -C "$WORKDIR" apply "$ROOT_DIR/core/patches/0001-add-united-regtest.patch"
git -C "$WORKDIR" apply --check "$ROOT_DIR/core/patches/0002-add-united-public-testnet.patch"
git -C "$WORKDIR" apply "$ROOT_DIR/core/patches/0002-add-united-public-testnet.patch"
git -C "$WORKDIR" diff --check

python3 "$ROOT_DIR/scripts/verify-public-testnet-genesis.py"
python3 -m py_compile "$ROOT_DIR/scripts/testnet-cpu-miner.py"

cmake -S "$WORKDIR" -B "$BUILD_DIR" -G Ninja \
  -DBUILD_TESTS=OFF -DBUILD_BENCH=OFF -DBUILD_GUI=OFF \
  -DBUILD_TX=OFF -DBUILD_UTIL=OFF -DENABLE_WALLET=ON \
  -DENABLE_IPC=OFF -DENABLE_EXTERNAL_SIGNER=OFF \
  -DWITH_ZMQ=OFF -DWITH_USDT=OFF

cmake --build "$BUILD_DIR" --parallel "$JOBS"

printf '\nUNITED candidate build complete.\n'
printf 'bitcoind: %s\n' "$BUILD_DIR/bin/bitcoind"
printf 'bitcoin-cli: %s\n' "$BUILD_DIR/bin/bitcoin-cli"
printf 'Private development chain: -chain=unitedregtest\n'
printf 'Public-testnet candidate: -chain=unitedtestnet\n'
printf 'No public bootstrap seeds are deployed; connect only to a verified operator peer.\n'
