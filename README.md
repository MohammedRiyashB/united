# UNITED Network

**United** is a proposed independent, SHA-256d proof-of-work cryptocurrency with a UTXO ledger and a nominal supply cap of 21,000,000 UNITED.

> **Project status: the private-regtest and UNITED public-testnet two-node native functional tests have passed. The public testnet is still not externally reachable or announced as live.** The candidate branch contains a distinct `unitedtestnet` chain, genesis, network identifiers and an experimental solo CPU GBT miner. The repository now prepares a checksum-verified Ubuntu 24.04 x86_64 node bundle after native CI passes. No public bootstrap hosts, independent external peer tests, Stratum pool, signed release, or independent consensus audit are complete. Testnet coins are valueless. Do not send real funds. No UNITED mainnet coins exist.

## Current agreed design

| Parameter | Draft value |
|---|---|
| Asset | United |
| Ticker | UNITED (working symbol; not legally or exchange-cleared) |
| Ledger | UTXO |
| Consensus target | SHA-256d Proof of Work |
| Nominal cap | 21,000,000 UNITED |
| Decimals | 8 |
| Initial subsidy | 50 UNITED per block |
| Halving interval | 210,000 blocks |
| Target block interval | 10 minutes |
| Difficulty timespan | 14 days / 2,016 blocks |
| Premine | 0 |
| Coinbase maturity | 100 blocks (draft) |

The exact scheduled subsidy issuance after smallest-unit integer halving is **20,999,999.97690000 UNITED**, below the nominal 21 million cap. Unclaimed coinbase rewards can reduce actual circulating issuance further. The Go reference model tests these values. A separate SHA-256d header demonstration mines and verifies a low-difficulty local regtest header; it is not a full node or live network.

## Repository status

| Area | Status |
|---|---|
| Architecture, threat model, roadmap | Drafted |
| Monetary schedule reference implementation | Implemented and unit-tested |
| SHA-256d header PoW demo | Implemented and unit-tested (regtest only) |
| Private `unitedregtest` chain parameters/genesis | Implemented and two-node functional CI passed |
| Bitcoin Core-derived full-node daemon/CLI | Native daemon/CLI build and startup tests passed |
| Private-regtest mining, wallet, transaction, P2P | Two-node end-to-end CI passed |
| Public testnet native chain type, genesis, two-node mining, wallet transfer and P2P | Implemented and passed native CI in `network/united-public-testnet` |
| Public seed nodes/bootstrap peers | Not deployed |
| Public solo mining | Experimental single-process Python GBT miner implemented; not ASIC/Stratum software |
| Stratum pool / mining coordinator | Not implemented |
| Public testnet node bundle | Checksum-verified CI artifact is being added; not a signed production release |
| Mainnet chain parameters/genesis | Not implemented |
| Mobile / desktop wallet release | Not implemented |
| Explorer / indexer / API | Contract draft only; not implemented |
| Public testnet | Native integration validated in CI; not externally live (no public bootstrap nodes) |
| Mainnet | Not launched; not launch-ready |
| External audit | Not performed |

## Quick start

Requirements: Go 1.23 or newer.

```bash
go test -race ./...
go vet ./...
go run ./cmd/united-params
go run ./cmd/united-params subsidy 210000
go run ./cmd/united-powdemo
```

Expected subsidy at height 210000: `25.00000000 UNITED`.

## Architecture direction

The proposed production node will be based on a pinned, signed Bitcoin Core release with a small, reviewable UNITED-specific patch set. Preserve upstream transaction validation, script, wallet and networking code where possible. Do not invent new cryptography. The proposed reference is Bitcoin Core v32.1; verify the signed release, release notes, known vulnerabilities, support status and dependency state again at implementation time. See [`core/UPSTREAM.md`](core/UPSTREAM.md).

Planned components:

- `unitedd`: independent full-node daemon, validation, chainstate, mempool and P2P.
- `united-cli` / RPC: node administration and integration interface.
- Mining software: SHA-256d mining client and independently operated pools.
- Wallets: descriptor-based self-custody desktop and mobile clients.
- Explorer/indexer: independently verifiable read-only chain data.
- Infrastructure: seed nodes, monitoring, release signing and reproducible builds.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for component boundaries and trust assumptions. The public-testnet candidate parameters are recorded in [`config/united-testnet.toml`](config/united-testnet.toml), with release gates in [`docs/PUBLIC_TESTNET_GO_NO_GO.md`](docs/PUBLIC_TESTNET_GO_NO_GO.md).

## Mainnet is gated, not a checkbox

A public mainnet is only acceptable after a complete consensus implementation exists, multiple independent operators have tested it, an external audit has been closed, all network identifiers and genesis values are publicly reproducible, and a public go/no-go review approves launch. A CI green check on this small reference model is not evidence of mainnet safety. See [`docs/MAINNET_GO_NO_GO.md`](docs/MAINNET_GO_NO_GO.md).

## Push to the existing GitHub repository

The target repository is `MohammedRiyashB/united`. From a machine with Git and the GitHub CLI (`gh`) installed and authenticated:

```bash
cd united
git remote add origin https://github.com/MohammedRiyashB/united.git
git push -u origin main
```

The helper [`scripts/create-github-repo.sh`](scripts/create-github-repo.sh) checks the existing repository and pushes this project to it. It refuses to force-push or overwrite an existing branch. Never paste a GitHub token into source files or chat.

## Naming and compliance notice

`UNITED` is a working project name and ticker only. Perform trademark, domain, ticker, exchange and ecosystem collision checks before public branding. The name “United” is already used in crypto-related projects. Do not imply affiliation with any such project.

Before offering custody, exchange, transfer, brokerage, payment or other VDA services, obtain India-specific legal advice on applicable PMLA/FIU-IND registration and AML/CFT, tax, consumer, privacy, cybersecurity and payment-system rules. Open-source node software and operating a VDA service are not automatically the same legal activity.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`SECURITY.md`](SECURITY.md). Protocol changes require a written specification, adversarial review, test vectors and an explicit activation plan. No one may merge a change that silently alters mainnet monetary policy.
