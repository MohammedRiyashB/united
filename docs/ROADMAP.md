# UNITED Development Roadmap

Dates are deliberately not promised. Each phase exits only when its acceptance criteria pass.

## Phase 0 — Governance, identity and protocol decisions

- Trademark, ticker, domain and ecosystem collision assessment.
- Public project governance, maintainer policy and disclosure channel.
- Freeze v1 monetary policy and decide all unresolved consensus parameters.
- Select and pin upstream source after security/support review.

**Exit:** signed decision record, reviewed protocol draft, public risk disclosures.

## Phase 1 — Core fork and chain parameter implementation

- Fork a signed, pinned upstream Bitcoin Core release.
- Change network identity, genesis, ports, address prefixes and seed discovery.
- Implement UNITED monetary policy in consensus-critical C++ code.
- Preserve upstream validation and wallet behavior wherever possible.
- Add block/transaction test vectors and negative consensus tests.

**Exit:** independent nodes produce and validate identical regtest chains; wrong-parameter nodes reject UNITED blocks.

## Phase 2 — Private regtest and miner integration

- Deterministic genesis procedure.
- Local multi-node P2P network with reorg and partition testing.
- CPU test miner / regtest block generation.
- Test transaction, fee, maturity and halving boundary behavior.

**Exit:** repeatable end-to-end tests; no unresolved consensus divergence.

## Phase 3 — Public testnet

- Independently operated seed nodes and full nodes.
- Public node binaries and setup documentation.
- Wallet address, backup, restore, send/receive and PSBT flows.
- Mining pool/client testnet deployment.
- Explorer/indexer sourced from independently operated nodes.

**Exit:** sustained public testnet with multiple independent miners, node operators and wallet users; documented incidents and fixes.

## Phase 4 — Adversarial testing and external audit

- Fuzz parsers, scripts, transactions, block headers, P2P messages and RPC.
- Simulate eclipse, Sybil, network partitions, 51% attacks, selfish mining and deep reorganizations.
- Test disk exhaustion, crash recovery, corrupted state and denial of service.
- External consensus/code/security audit; publish report and remediation evidence.
- Reproducible builds and signed release pipeline.

**Exit:** no unresolved critical/high findings; low/medium issues risk-accepted publicly; independent sign-off.

## Phase 5 — Mainnet readiness review

- Freeze genesis and consensus parameters.
- Verify supply schedule and code with independent implementations.
- Confirm seed infrastructure, operator diversity, monitoring, incident response and backups.
- Publish risk disclosures, mining instructions, wallet verification keys and launch runbook.
- Obtain legal review for all planned services in each target jurisdiction.

**Exit:** public go/no-go checklist approved by independent maintainers, not only the founder.

## Phase 6 — Mainnet launch

- Publish signed source and binaries with hashes and reproducible build instructions.
- Publish genesis data and independent verification commands.
- Launch seed/full-node network and open mining under transparent conditions.
- Monitor chain health and publish incident/upgrade notices.

**Exit:** stable operation under independent node/miner participation; no claim that market value or exchange listings are guaranteed.

## Phase 7 — Ecosystem expansion

- Merchant SDK and payment tooling.
- Hardware wallet integration after vendor review.
- Additional wallets and language SDKs.
- Optional scaling research, only as a separate reviewed protocol proposal.

Do not build exchange custody or a bridge before appropriate legal, operational and security controls exist.
