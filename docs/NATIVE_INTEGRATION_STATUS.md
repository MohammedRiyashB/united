# UNITED native Bitcoin Core integration status

**Active branch:** `integration/united-regtest-functional-tests`  
**Upstream:** Bitcoin Core `v32.1`, pinned in `core/upstream.lock.toml`.

## Verified baseline

GitHub Actions run [42119554863](https://github.com/MohammedRiyashB/united/actions/runs/42119554863) passed the native private-regtest smoke test: pinned-source verification, patch application, CMake configuration, daemon/CLI compilation, daemon startup and genesis RPC check.

This was a **private development regtest** verification only.

## Latest functional-test failure: root cause found

Run [42155142254](https://github.com/MohammedRiyashB/united/actions/runs/42155142254) showed:

- Native wallet-enabled daemon and CLI compilation succeeded.
- Both UNITED regtest nodes initialized successfully.
- Both wallets were created.
- The first mining call failed with `TestBlockValidity failed: time-too-new, block timestamp too far in the future`.

The cause was the private-regtest genesis timestamp `1794000000`, which is **2026-11-06 21:20:00 UTC**. The GitHub Actions runner was executing at approximately **2026-11-06 03:23 UTC**, making the genesis timestamp about 18 hours ahead of the node's adjusted clock. The genesis block itself could be loaded, but the first child blocks could not pass timestamp validation. This was not a wallet-creation or P2P-port failure.

## Corrective changes committed

- Set the private-regtest genesis timestamp to the fixed historical value `1700000000` (2023-11-14 22:13:20 UTC), avoiding a clock-dependent future genesis.
- Set the genesis nonce to `1` and recalculated its header hash using SHA-256d. The resulting hash is `6d8278642c6e1390286c74bd2697c5251771e9da1b860a5bd3d692b5d0ead151`; the Merkle root remains `a9d90d5e7998936472072e79bc476b84d400c5ac22f174e23051c01778c25cc7`.
- Updated the CI genesis assertion to the new hash.
- Added the `UNITEDREGTEST` display case to Bitcoin Core's `bitcoin-cli -netinfo` chain label switch, removing the compiler's unhandled-enum warning.
- Removed the fake `.invalid` DNS seed from this private network; the seed list remains empty.

**Validation state:** these changes require a fresh CI run. Mining, P2P propagation, transaction confirmation and wallet balance checks remain unverified until that run passes.

## Functional test sequence

The CI job is designed to exercise two independent nodes with isolated data directories and loopback ports. It verifies matching genesis hashes, creates separate wallets, mines 101 blocks, checks coinbase maturity and miner balance, establishes a TCP P2P connection, sends 1 UNITED, mines a confirmation block, then checks node synchronization and recipient balance.

## Public testnet is the next distinct release stage

The private `unitedregtest` network is not a public testnet. Before public testnet release, the project still needs:

- A separate public-testnet chain type with unique message magic, P2P/RPC ports, address prefixes and Bech32 HRP.
- A deterministic public-testnet genesis block with independently verified SHA-256d proof of work and fixed consensus parameters.
- Public bootstrap peers/DNS seeds or a documented safe initial peer-connection process; no usable public seeds are configured now.
- Mainnet-independent testnet difficulty and timestamp rules, plus consensus test vectors and native tests for subsidy, money range, retargeting, reorgs, scripts and transaction validation.
- Operator instructions, configuration examples, monitoring, release checksums/signatures and a public issue-reporting process.
- A public testnet soak with multiple independent operators before treating the network as stable.

## Mainnet is not part of this testnet release

The private regtest deliberately uses an easy PoW target, minimum-difficulty allowance and disabled retargeting. Those values must not be reused as production mainnet settings. The draft subsidy schedule totals `20,999,999.97690000 UNITED` under smallest-unit integer halving, with a nominal 21,000,000 UNITED cap. Production mainnet genesis, PoW limit, activation schedule, seed infrastructure and independent security/consensus audit are not complete.

Do not accept real funds, advertise this private regtest as a live public network, or describe UNITED mainnet as launched.
