# Native Bitcoin Core integration workspace

## Current implementation status

- Upstream: Bitcoin Core `v32.1`
- Exact tag object and commit: locked in [upstream.lock.toml](upstream.lock.toml)
- Native patches: [0001-add-united-regtest.patch](patches/0001-add-united-regtest.patch), [0002-add-united-public-testnet.patch](patches/0002-add-united-public-testnet.patch)
- Build and smoke-test workflow: [bitcoin-core-upstream.yml](../.github/workflows/bitcoin-core-upstream.yml)
- Bootstrap helper: [bootstrap-bitcoin-core.sh](../scripts/bootstrap-bitcoin-core.sh)
- Candidate build helper: [build-united-node.sh](../scripts/build-united-node.sh)
- Test-only public-testnet GBT miner (coinbase witness commitment; no witness mempool txs): [testnet-cpu-miner.py](../scripts/testnet-cpu-miner.py)

Patch 0001 adds the private `unitedregtest` chain. Patch 0002 adds a separate `unitedtestnet` candidate with its own genesis, message magic, ports, address formats, chain type and CLI/Qt labels. Both retain Bitcoin Core's native SHA-256d proof-of-work, block validation, UTXO, P2P, wallet and RPC machinery.

The public-testnet candidate uses a real retarget schedule; it does not inherit private regtest's no-retarget mode. Its PoW limit is intentionally easier than mainnet for a valueless test network. The candidate has no DNS seeds or fixed seeds because no seed operators have been deployed.

**Network distinction:** `unitedregtest` is a private development network and deliberately uses an easy PoW target, minimum-difficulty blocks and disabled retargeting. `unitedtestnet` is a separate public-testnet candidate with retargeting enabled and a different genesis/network identity. Neither configuration is mainnet, and testnet coins have no value.

## Build process

The GitHub Actions workflow:
1. Independently verifies the candidate public-testnet genesis in Python.
2. Clones the exact Bitcoin Core v32.1 release.
3. Verifies the locked tag object and commit IDs.
4. Applies both UNITED C++ patches.
5. Compiles the wallet-enabled native daemon and CLI.
6. Starts two isolated `unitedregtest` nodes and checks both genesis hashes.
7. Creates independent private-regtest wallets, mines past coinbase maturity, checks a TCP P2P connection, sends a transaction, confirms a block and checks node synchronization/balance.
8. Starts two public-testnet nodes, checks both testnet genesis hashes and `tunit1` addresses, and verifies their TCP P2P handshake.

Earlier candidate revisions passed the two-node private-regtest and public-testnet smoke tests. However, the audited `main` commit did not yet have a native workflow run because the workflow lacked a push trigger for `main`; this audit adds that trigger. Do not claim the audited `main` revision has passed native validation until its new workflow run succeeds on both architectures. The workflow checks the pinned tag object and commit but does not yet establish independent GPG signer trust; release-grade provenance still requires independent signer-fingerprint verification.

## Still not implemented

- Public seed/bootstrap hosts, independently operated miners/pools and monitoring
- Reproducible signed release artifacts and independent consensus/security review
- Mainnet chain parameters, mainnet genesis and production difficulty configuration
- Independent consensus test vectors and audit
- Production release builds, seed infrastructure and launch readiness

Do not relabel upstream binaries as UNITED or accept funds on this private regtest network.
