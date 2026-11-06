# Native Bitcoin Core integration workspace

## Current implementation status

- Upstream: Bitcoin Core `v32.1`
- Exact tag object and commit: locked in [upstream.lock.toml](upstream.lock.toml)
- Native patches:
  - [0001-add-united-regtest.patch](patches/0001-add-united-regtest.patch)
  - [0002-add-united-public-testnet.patch](patches/0002-add-united-public-testnet.patch)
- Public testnet genesis verifier: [verify-united-testnet-genesis.py](../scripts/verify-united-testnet-genesis.py)
- Build and smoke-test workflow: [bitcoin-core-upstream.yml](../.github/workflows/bitcoin-core-upstream.yml)
- Bootstrap helper: [bootstrap-bitcoin-core.sh](../scripts/bootstrap-bitcoin-core.sh)

The native C++ patches add two separate chain types:
- `unitedregtest`: private development network, easy PoW and no retargeting.
- `unitedtestnet`: public-testnet candidate with distinct genesis, message magic, ports, address formats and periodic difficulty retargeting.

Both inherit Bitcoin Core's native SHA-256d, block validation, UTXO, P2P, wallet and RPC machinery. The public-testnet genesis can be independently reproduced by the Python standard-library verifier.

**Important:** this is a private development network. It deliberately uses an easy PoW target, allows minimum difficulty and disables retargeting for rapid local testing. These settings are not proposed mainnet settings.

## Build process

The GitHub Actions workflow:
1. Clones the exact Bitcoin Core v32.1 release.
2. Verifies the locked tag object and commit IDs.
3. Applies the UNITED C++ patch.
4. Applies the private-regtest and public-testnet patches.
5. Independently reproduces the public-testnet genesis transaction, Merkle root and SHA-256d header.
6. Compiles the wallet-enabled native daemon and CLI.
7. Starts two isolated private-regtest nodes and checks both genesis hashes.
8. Creates independent private-regtest wallets, mines past coinbase maturity, checks a TCP P2P connection, sends a transaction, confirms a block and checks node synchronization/balance.
9. Repeats the mining, wallet, transaction and P2P flow on two isolated `unitedtestnet` nodes.

The two-node functional sequence is not considered verified until its current workflow run passes every step. The last diagnosed failure was a future-dated private genesis timestamp; the genesis time, nonce and expected hash have now been corrected and the patch is being revalidated.

The workflow run must pass before claiming a successful native build. The release signing key still requires independent fingerprint verification for a release-grade source provenance check.

## Still not implemented

- UNITED public-testnet and mainnet chain parameters
- Public-network genesis, production difficulty configuration and public seed infrastructure
- Independent consensus test vectors and audit
- Production release builds, seed infrastructure and launch readiness

Do not relabel upstream binaries as UNITED or accept funds on this private regtest network.
