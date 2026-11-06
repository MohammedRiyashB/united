# UNITED native Bitcoin Core integration status

**Base upstream:** Bitcoin Core `v32.1`  
**Pinned commit:** `f0de87f040621468b956f01f526a43a010310501`  
**Audited repository revision:** `main` at `dffee3918a46ccff61f2e115fd620d165baec628`  
**Status:** the repository contains both native chain patches and candidate network configuration. Earlier candidate revisions passed private-regtest and public-testnet two-node smoke tests. The audited `main` SHA has **not** yet been validated by the native workflow because that workflow did not run on pushes to `main`; an audit branch adds a push trigger. The public network is not externally live: there are no independently operated public bootstrap peers or miners.
## 1. Private UNITED regtest — verified

GitHub Actions run [42157048924](https://github.com/MohammedRiyashB/united/actions/runs/42157048924) passed the native build and all private two-node tests:
- pinned upstream tag and commit verified;
- private-regtest patch applied and native daemon/CLI compiled;
- two private nodes started and reported the expected genesis hash;
- independent wallets and addresses created;
- 101 blocks mined and coinbase maturity/miner balance validated;
- TCP P2P connection established;
- transaction sent, block confirmed, and second node synchronized/received funds.

Private genesis:
- Timestamp `1700000000`, nonce `1`, bits `0x207fffff`.
- Merkle root `a9d90d5e7998936472072e79bc476b84d400c5ac22f174e23051c01778c25cc7`.
- Hash `6d8278642c6e1390286c74bd2697c5251771e9da1b860a5bd3d692b5d0ead151`.

## 2. UNITED public-testnet candidate — implemented

PR [#8](https://github.com/MohammedRiyashB/united/pull/8) adds a separate native `unitedtestnet` chain with:
- message magic `fa b1 d0 02`;
- P2P/RPC ports `29446/29447`;
- Bech32 HRP `tunit`, Base58 prefixes `75/76/203`;
- 50 UNITED subsidy, 210,000-block halving, 600-second spacing, 2,016-block retargeting;
- testnet-only delayed-block minimum-difficulty rule and BIP94 retarget protection;
- no inherited Bitcoin testnet checkpoints, assume-valid hash, snapshots, DNS seeds or fixed seeds.

Candidate genesis, independently verified:
- Timestamp `1793937600` (2026-11-06 04:00 UTC), nonce `3565`, bits `0x1f0fffff`.
- Merkle root `d913e5cf8a09ccf5d4382c4a1e78d8e8b62c9bc0538240c05b26e2baa1d35446`.
- Hash `0003d0389ed5b8854934bcb977dac8b78c4bc7cd8ea1d3223934a3ba79b033f1`.

Genesis is a testnet candidate, not mainnet. If launch is delayed more than 24 hours from the genesis timestamp, re-check initial-block-download/bootstrap behavior before freezing it. Once public nodes accept blocks, genesis must not be changed.

## 3. Public-testnet functional evidence

GitHub Actions run [42164550405](https://github.com/MohammedRiyashB/united/actions/runs/42164550405) completed successfully:
- both public-testnet nodes started on isolated data directories;
- both returned the expected genesis and `unitedtestnet` chain identity;
- testnet wallets were created;
- nodes connected over P2P;
- a test-only `getblocktemplate`/`submitblock` SHA-256d miner produced blocks 1 through 101;
- the second node synchronized through P2P;
- a 1 UNITED wallet transaction was sent;
- the miner produced block 102 and the second wallet's balance assertion passed.

The strengthened CI miner constructs the BIP141 coinbase witness reserved value and validates the template witness commitment. It deliberately rejects witness-bearing mempool transactions; CI uses legacy wallet transactions. This is a test harness, not a production miner.

## 4. Latest strengthened validation

Go CI:
- [42165092454](https://github.com/MohammedRiyashB/united/actions/runs/42165092454) passed miner serialization unit tests.
- [42165119995](https://github.com/MohammedRiyashB/united/actions/runs/42165119995) passed Go checks plus the expanded miner unit tests.

Latest native run:
- [42165119964](https://github.com/MohammedRiyashB/united/actions/runs/42165119964) completed successfully.
- All 13 job steps passed: miner unit/syntax checks, independent genesis verification, exact upstream source pin, both native patches, CMake configuration, native daemon/CLI compilation, private-regtest two-node functional tests, public-testnet two-node startup, genesis/network identity, wallet creation, GBT/submitblock mining through block 101, P2P synchronization, 1 UNITED test transaction, block 102 confirmation, and recipient balance verification.

This is strong local integration evidence, but it is not proof of public reachability or independent consensus/security review.

## 5. Remaining blockers before public announcement

- No DNS seed/fixed seed or externally reachable bootstrap nodes are deployed. CI nodes are loopback-only.
- No independently operated public mining client/pool is deployed. The Python miner is only a test harness.
- Public address/magic/port collision review and independent consensus review are not complete.
- Relevant upstream functional, fuzz, sanitizer and regression suites have not all been run on the patched tree.
- Signed reproducible candidate binaries, checksums, SBOM, monitoring, vulnerability disclosure and an independent multi-operator soak remain open.

Current decision: **NO-GO for public announcement** until those conditions are satisfied. Testnet coins have no value; do not accept funds.
