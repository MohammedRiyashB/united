# Native Bitcoin Core integration workspace

## Current implementation status

- Upstream: Bitcoin Core `v32.1`
- Exact tag object and commit: locked in [upstream.lock.toml](upstream.lock.toml)
- Native patch: [0001-add-united-regtest.patch](patches/0001-add-united-regtest.patch)
- Build and smoke-test workflow: [bitcoin-core-upstream.yml](../.github/workflows/bitcoin-core-upstream.yml)
- Bootstrap helper: [bootstrap-bitcoin-core.sh](../scripts/bootstrap-bitcoin-core.sh)

The first native C++ patch adds a private `unitedregtest` chain type, distinct genesis block, message magic, ports, data directory and address prefixes. It uses Bitcoin Core's native SHA-256d proof-of-work, block validation, UTXO, P2P and RPC machinery.

**Important:** this is a private development network. It deliberately uses an easy PoW target, allows minimum difficulty and disables retargeting for rapid local testing. These settings are not proposed mainnet settings.

## Build process

The GitHub Actions workflow:
1. Clones the exact Bitcoin Core v32.1 release.
2. Verifies the locked tag object and commit IDs.
3. Applies the UNITED C++ patch.
4. Compiles the native daemon and CLI.
5. Starts `bitcoind -chain=unitedregtest` and checks the genesis hash over RPC.

The workflow run must pass before claiming a successful native build. The release signing key still requires independent fingerprint verification for a release-grade source provenance check.

## Still not implemented

- UNITED public testnet and mainnet chain parameters
- Mainnet genesis and production difficulty configuration
- Independent consensus test vectors and audit
- Production release builds, seed infrastructure and launch readiness

Do not relabel upstream binaries as UNITED or accept funds on this private regtest network.
