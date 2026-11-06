# UNITED Consensus Specification — Migration Baseline 0.2

**Status:** migration baseline / design freeze candidate. Not implemented, not a complete deployable consensus specification, and not a launch authorization.

This document selects Bitcoin Core 32.1 as the upstream codebase candidate. It does not claim that a UNITED fork has been built. The upstream source pin is recorded in [`core/upstream.lock.toml`](../core/upstream.lock.toml).

## 1. Monetary policy (UNITED-specific)

| Parameter | Value |
|---|---:|
| Asset | United |
| Working ticker | UNITED |
| Smallest unit | 1 satoshi-style unit = 0.00000001 UNITED |
| Initial subsidy | 5,000,000,000 units (50 UNITED) |
| Halving interval | 210,000 blocks |
| Nominal cap | 21,000,000 UNITED |
| Premine | 0 |
| Subsidy calculation | integer right shift / floor division |

For block height `h >= 0`:

```text
halvings = floor(h / 210000)
subsidy_units(h) = floor(5,000,000,000 / 2^halvings)
```

The subsidy becomes zero when integer division yields zero. The full theoretical scheduled subsidy is 2,099,999,997,690,000 smallest units = **20,999,999.97690000 UNITED**. This is below the nominal 21-million ceiling. Transaction fees are transfers, not new issuance. Coinbase outputs that are never claimed do not become spendable supply. All monetary arithmetic must use bounded integer types and reject overflow/out-of-range values.

## 2. Upstream inheritance policy

Use Bitcoin Core 32.1 as the implementation base, retaining upstream consensus-critical machinery rather than reimplementing it in the Go alpha:

- UTXO validation and state transitions;
- transaction and block serialization, hashing and merkle construction;
- script interpreter and signature verification;
- proof-of-work target decoding, canonical compact encoding and SHA-256d header hashing;
- accumulated-chainwork fork choice and full chain reorganization handling;
- median-time-past and future-time checks;
- block validation, undo data, crash recovery and chainstate persistence;
- P2P message framing, peer protocol and validation pipeline;
- RPC behavior, subject to UNITED-specific network configuration and secure deployment.

Any upstream change touching consensus, validation, scripts, serialization, chain selection or storage must be reviewed against this pin. Do not copy isolated functions into the Go alpha and call that a production fork.

## 3. UNITED proof-of-work and block timing

The selected baseline is Bitcoin-style SHA-256d proof of work:

- Header hash: double SHA-256 of the canonical serialized block header.
- Target spacing: **600 seconds**.
- Target timespan: **1,209,600 seconds (14 days)**.
- Retarget interval: **2,016 blocks**.
- Retarget adjustment: Bitcoin Core's pinned upstream calculation and integer arithmetic, including its historical-timespan clamp (maximum 4× easier or harder per adjustment), unless a separately reviewed consensus proposal explicitly changes it.
- Minimum-difficulty exception: disabled on mainnet.
- No-retarget mode: disabled on mainnet.
- Chain selection: greatest accumulated valid chainwork, not simply greatest height.
- Coinbase maturity: **100 blocks** (UNITED-specific parameter).

Important: the exact `powLimit`, genesis `nBits`, initial difficulty, testnet difficulty exceptions, and any testnet-only no-retarget behavior are network parameters and remain unset until test-vector review. Never copy Bitcoin's genesis block, genesis hash, message magic, ports, address prefixes or seed nodes.

## 4. Transaction and script compatibility

Use the pinned upstream transaction formats and script interpreter. The UNITED chain must define its activation schedule independently:

- Do not copy Bitcoin mainnet's historical activation heights or activation block hashes.
- Do not activate a rule at height zero merely by assumption.
- For every inherited rule or deployment, document its activation mechanism, start/timeout conditions, threshold/window, minimum activation height and test vectors.
- The initial deployment set must be reviewed for safe activation from UNITED genesis; legacy compatibility must not accidentally disable modern validation.
- Separate consensus rules from mempool relay policy, dust policy, wallet policy and RPC policy.

No custom signature scheme, transaction hash, script opcode or cryptographic primitive is authorized by this baseline.

## 5. Network separation and genesis

Mainnet, public testnet and regtest require independently generated and non-colliding values for:

- genesis coinbase transaction, timestamp, nonce, compact target, merkle root and genesis hash;
- four-byte P2P message-start bytes and default ports;
- Base58 prefixes and Bech32/Bech32m human-readable prefixes;
- DNS seeds / fixed seeds (none until operators are confirmed);
- chain type, checkpoints/assume-valid policy and minimum chainwork policy;
- test-only mining and difficulty options.

All values must be committed in source, accompanied by deterministic generation scripts and expected-output tests. Mainnet genesis must be reproducible from public source and independently verified by at least two parties.

## 6. Security and release requirements

Before a public testnet:
1. Build the pinned upstream from a clean checkout with documented dependencies.
2. Implement UNITED parameters and genesis generation in the native upstream codebase.
3. Run upstream unit, functional, fuzz, sanitizer and regression suites relevant to consensus and networking.
4. Add UNITED-specific subsidy-boundary, money-range, compact-target, PoW, retarget-boundary, MTP, future-time, chainwork/reorg, script, serialization, UTXO and crash-recovery vectors.
5. Have independent reviewers inspect every consensus diff.
6. Produce reproducible build instructions, SBOM, source archive, binary checksums and provenance.

Before mainnet: independent security/consensus audit, remediation and retest, a sustained public testnet with independent operators, incident response and monitoring, legal review, and explicit signed launch approval.

## 7. Non-goals and status

- The existing Go implementation is an experimental alpha/reference prototype only; it is not consensus-authoritative.
- This baseline is not a wallet release, public testnet, mainnet, investment offer or claim of monetary value.
- No UNITED mainnet coins exist. Do not accept funds or advertise an exchange listing.
- No upstream binaries are being relabelled as UNITED binaries.

## 8. Current private-regtest implementation (not a public parameter set)

The native integration branch now contains a separate `unitedregtest` chain type for local testing only:

| Parameter | Private regtest value |
|---|---|
| Chain type | `unitedregtest` |
| Initial subsidy / halving | 50 UNITED / 210,000 blocks |
| Target spacing / timespan | 600 seconds / 1,209,600 seconds |
| PoW limit and genesis bits | `7fff...ffff` / `0x207fffff` |
| Minimum-difficulty exception | Enabled |
| Automatic retargeting | Disabled |
| Message magic | `fa b1 d0 01` |
| Default P2P / RPC ports | 29444 / 29443 |
| Address prefixes / HRP | private values; HRP `unitrt` |
| Seed nodes | None |

The private genesis is timestamp `1700000000`, nonce `1`, Merkle root `a9d90d5e7998936472072e79bc476b84d400c5ac22f174e23051c01778c25cc7`, and header hash `6d8278642c6e1390286c74bd2697c5251771e9da1b860a5bd3d692b5d0ead151`. These values are not suitable for a public testnet or mainnet. The public testnet and mainnet each need their own reviewed consensus and network parameters.

## 9. Open values required before implementation can be called complete

The following are intentionally not guessed for public testnet and mainnet: `powLimit`, genesis parameters, P2P magic/ports, address prefixes/HRPs, initial script deployment schedule, DNS seeds, checkpoints, minimum chainwork, assume-valid policy, public testnet difficulty policy and final release versioning. These require collision checks, operator/security review and committed test vectors.
