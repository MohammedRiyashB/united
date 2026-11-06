# UNITED Public Testnet Go/No-Go Checklist

**Current decision: NO-GO for public release.** A separate `unitedtestnet` chain type and candidate genesis/network parameters now exist in the native integration branch. The native two-node public-testnet CI is still pending, and no public seed/bootstrap servers are deployed. This checklist defines the evidence required before announcing or distributing a public UNITED testnet.

Testnet coins must be clearly labelled as valueless. Do not accept deposits, sell testnet coins, promise returns, or reuse any mainnet keys, addresses, data directories or credentials.

## Consensus and network identity

- [ ] Independently review and freeze the candidate public-testnet consensus specification.
- [x] Candidate PoW limit, target spacing/timespan, retargeting and minimum-difficulty rules are implemented; independent review and final freeze remain pending.
- [ ] Review coinbase maturity, subsidy schedule, money range, block weight and script/transaction activation settings in native C++ code.
- [x] Candidate testnet genesis coinbase/header and an independent Python standard-library verifier are implemented; fresh native CI and independent review remain pending.
- [x] Candidate message magic, P2P/RPC ports, Base58 prefixes and Bech32 HRP are configured; external collision review remains pending.
- [x] A separate `unitedtestnet` chain type, `unitedtestnet` data-directory suffix and distinct identifiers are implemented; native network-isolation tests remain pending.
- [ ] Add and run positive/negative native consensus vectors for invalid PoW, compact-target edge cases, future timestamps, retarget boundaries, subsidy/money boundaries, scripts, transactions and reorgs.
- [ ] Verify wrong-network nodes reject UNITED testnet blocks and addresses.

## Software validation and supply chain

- [ ] Re-check the upstream release for current support status, security advisories and dependencies.
- [ ] Verify the upstream signed tag with an independently trusted maintainer keyring; record the full commit, signer fingerprint, source hashes and SBOM.
- [ ] Run relevant upstream unit, functional, fuzz and sanitizer suites, not just a successful daemon compilation.
- [ ] Pass public-testnet multi-node CI for mining, wallets, sends/receives, mempool relay, block sync, disconnections, partitions, restarts and competing-chain reorganization.
- [ ] Have independent reviewers inspect every consensus-critical patch. No unresolved critical/high findings.
- [ ] Produce reproducible source builds and platform binaries with checksums, provenance and offline-signed release metadata.

## Public peer and operator infrastructure

- [ ] Confirm multiple seed/bootstrap peers operated by independent people, providers and regions; publish ownership and endpoint health.
- [ ] Verify peer discovery, connection limits, anti-eclipse/Sybil mitigations, ban behavior and restart/recovery.
- [ ] Publish a safe node operator guide with firewall rules. P2P may be public; wallet/admin RPC must remain localhost or private.
- [ ] Operate independent archival/full nodes and monitoring for height, chain-tip age, peer diversity, reorg depth, hash rate, disk and uptime.
- [ ] Publish mining instructions and at least two independent mining operator setups; no founder-only block production.
- [ ] Publish wallet install/build, address verification, backup/restore and transaction verification instructions.
- [ ] Establish a monitored private vulnerability disclosure channel and response process before inviting public users.
- [ ] Publish a public incident contact, issue triage process and testnet reset/recovery policy.
- [ ] Obtain legal review for the actual activities and jurisdictions. An open-source testnet does not authorize an exchange, custody, payment or VDA service.

## Release and launch approval

- [ ] Publish exact genesis, network magic, ports, address formats, consensus parameters and software commit.
- [ ] Publish checksums, signatures, SBOM, reproducible-build instructions and source provenance.
- [ ] Test clean install, upgrade, config migration, data directory separation and full resync from independent peers.
- [ ] Complete a public go/no-go review with evidence links and approval from independent maintainers.
- [ ] Start the public testnet with multiple independent node/miner/wallet operators and a documented soak period.
- [ ] Keep a public changelog and communicate every consensus-affecting change with an explicit network reset or activation procedure.

## Current evidence

- [x] Native private `unitedregtest` chain patch exists.
- [x] Private-regtest native CI passed the complete two-node mining, wallet, transaction and P2P flow (run [42157048924](https://github.com/MohammedRiyashB/united/actions/runs/42157048924)).
- [x] Separate `unitedtestnet` chain type and candidate genesis/network parameters are implemented in branch `feature/united-public-testnet`.
- [x] Independent Python genesis verifier is added.
- [ ] Native patch #0002 applies and the public-testnet daemon/CLI compiles in fresh CI.
- [ ] Two-node public-testnet genesis, mining, wallet, transaction and P2P CI passes.
- [ ] Public seed/bootstrap servers and independent operators are deployed.
- [ ] Full upstream and UNITED-specific consensus/fuzz/sanitizer/security suites pass.
- [ ] Reproducible signed release artifacts, SBOM and checksums are published.
- [ ] Independent protocol/security review and public release approval are complete.

A green private-regtest CI job does not release a public testnet. A public-testnet chain candidate with manual peering is not yet a publicly discoverable network.
