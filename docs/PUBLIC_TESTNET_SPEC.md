# UNITED Public Testnet — Candidate Consensus Specification

**Status: design candidate only. Not yet implemented in the native node, not a live network, and not authorized for public mining or use.** All parameters below must pass native integration tests and independent review before activation. Testnet coins have no monetary value.

## Network identity

| Field | Candidate value |
|---|---|
| Chain selector | `-chain=unitedtestnet` |
| Data directory | `unitedtestnet` |
| P2P port | `39444` |
| RPC port | `39443` (localhost/private only) |
| P2P message magic | `fa ce b5 02` |
| Bech32 HRP | `tunit` |
| Base58 pubkey/script/WIF prefixes | `67 / 68 / 194` |
| DNS/fixed seeds | None provisioned |
| Bootstrap | Explicit `-addnode=<operator-host>:39444` only after trusted operators publish reachable nodes |

The message magic and prefixes are candidate identifiers, not proof of global uniqueness. A collision scan and independent review are still required. Never expose wallet/admin RPC to the public internet.

## Monetary policy inherited from UNITED

- SHA-256d proof of work.
- 50 UNITED initial subsidy.
- Halving interval: 210,000 blocks.
- 8 decimal places.
- 100-block coinbase maturity.
- No premine.
- Same subsidy arithmetic as the proposed UNITED policy; testnet coins are valueless and may be reset.

## Candidate proof-of-work policy

| Parameter | Candidate |
|---|---|
| Target spacing | 600 seconds |
| Target timespan | 1,209,600 seconds (14 days) |
| Retarget interval | 2,016 blocks |
| PoW limit | `00000fffff000000000000000000000000000000000000000000000000000000` |
| Compact genesis bits | `0x1e0fffff` |
| Minimum-difficulty exception | Enabled for testnet |
| BIP94 retarget behavior | Enabled |
| No-retargeting | Disabled |

The testnet minimum-difficulty exception is a deliberate test-network availability tradeoff. It makes timestamp manipulation and difficulty oscillation a testnet concern; this policy must not be copied to mainnet. Native retarget-boundary, delayed-block, recovery, timestamp and chainwork/reorg tests are required.

## Candidate genesis block

| Field | Value |
|---|---|
| Timestamp | `1735689600` (2025-01-01 00:00:00 UTC) |
| Version | `1` |
| Bits | `0x1e0fffff` |
| Nonce | `1129160` |
| Coinbase reward | 50 UNITED |
| Merkle root | `3184f943619d506bdc6af367ba93346790766eaa244fdff3989df0a020975256` |
| SHA-256d block hash | `00000f7003bea5babbc9b271415f351472e51edd3d34e798214f6734b8d27da9` |

Genesis message: `UNITED public testnet genesis - test coins have no monetary value`.

The repository's standard-library verifier reconstructs the coinbase transaction and 80-byte header, checks the Merkle root and header hash, and verifies the genesis proof of work against the candidate target:

```bash
python3 scripts/verify-public-testnet-genesis.py
```

## Mandatory work before a public release

1. Integrate these candidate values as a distinct native `CChainParams` chain type; do not reuse private-regtest or Bitcoin testnet chain state.
2. Compile the native daemon/CLI and verify the candidate genesis hash through RPC.
3. Add native tests for wrong-network rejection, subsidy/money bounds, compact-target validity, retarget boundaries, MTP/future-time, invalid PoW, scripts, mempool relay, reorgs and restarts.
4. Run a multi-node test with nodes on separate machines and independently operated miners.
5. Provision at least two stable bootstrap nodes in separate failure domains and publish their operators/addresses. Do not fabricate DNS seeds or hard-code unowned infrastructure.
6. Complete security review, reproducible build, signed artifacts, checksums, SBOM, operator guide, vulnerability reporting and a public reset/incident policy.
7. Approve a public testnet launch only after the go/no-go checklist has evidence for every mandatory item.

## Current release decision

**NO-GO.** A candidate genesis hash and configuration are not a network. The native chain selector, peer infrastructure, independent operators and release artifacts are not yet verified. Do not advertise a live network or ask users to mine/send coins until the release gates pass.
