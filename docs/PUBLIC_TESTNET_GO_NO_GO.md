# UNITED Public Testnet Go/No-Go Checklist

**Current decision: NO-GO for public announcement.** A public-testnet candidate chain type and genesis are implemented on `network/united-public-testnet`; native compile and end-to-end testnet GBT mining/transfer CI remain pending. This checklist defines the evidence required before announcing or distributing a live public UNITED testnet.

Testnet coins must be clearly labelled as valueless. Do not accept deposits, sell testnet coins, promise returns, or reuse any mainnet keys, addresses, data directories or credentials.

## Consensus and network identity

- [x] Publish a public-testnet candidate consensus specification.
- [ ] Freeze it after independent review and public change control.
- [x] Document candidate testnet PoW limit, target spacing/timespan, retarget algorithm and minimum-difficulty behavior.
- [ ] Independently review the exact rules and test vectors before launch.
- [ ] Review coinbase maturity, subsidy schedule, money range, block weight and script/transaction activation settings in native C++ code.
- [x] Generate a testnet-only genesis coinbase and header; an independent Python verifier reproduces the Merkle root, SHA-256d hash and proof of work.
- [ ] Have a second independent reviewer reproduce the genesis byte-for-byte.
- [x] Select candidate message magic, P2P/RPC ports, Base58 prefixes and Bech32 HRP.
- [ ] Complete independent global collision checks before freezing them.
- [ ] Configure independent testnet chain type and data directory. Verify mainnet, testnet and private regtest data cannot be confused.
- [ ] Add positive and negative native consensus vectors, including invalid PoW, invalid compact targets, future timestamps, retarget boundaries, subsidy/money boundaries, invalid scripts, invalid transactions and reorgs.
- [ ] Verify wrong-network nodes reject UNITED testnet blocks and addresses.

## Software validation and supply chain

- [ ] Re-check the upstream release for current support status, security advisories and dependencies.
- [ ] Verify the upstream signed tag with an independently trusted maintainer keyring; record the full commit, signer fingerprint, source hashes and SBOM.
- [ ] Run relevant upstream unit, functional, fuzz and sanitizer suites, not just a successful daemon compilation.
- [ ] Pass the current native two-node public-testnet GBT mining, wallet, send/receive, mempool relay and P2P sync CI.
- [ ] Add multi-node backup/restore, disconnection, partition, restart and competing-chain reorganization tests.
- [ ] Have independent reviewers inspect every consensus-critical patch. No unresolved critical/high findings.
- [ ] Produce reproducible source builds and candidate binaries with checksums, provenance and offline-signed release metadata.

## Public peer and operator infrastructure

- [ ] Confirm multiple seed/bootstrap peers operated by independent people, providers and regions; publish ownership and endpoint health.
- [ ] Verify peer discovery, connection limits, anti-eclipse/Sybil mitigations, ban behavior and restart/recovery.
- [ ] Publish a safe node operator guide with firewall rules. P2P may be public; wallet/admin RPC must remain localhost or private.
- [ ] Operate independent archival/full nodes and monitoring for height, chain-tip age, peer diversity, reorg depth, hash rate, disk and uptime.
- [x] Add a test-only getblocktemplate/submitblock CPU miner for CI and a manual operator example.
- [ ] Publish production mining instructions and verify at least two independent miner/operator setups; no founder-only block production.
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

- [x] Candidate public-testnet chain type and distinct network configuration are in the native patch.
- [x] Candidate genesis time is set to 2026-11-06 04:00 UTC to allow bootstrap miners to request templates during the initial release window. If launch slips beyond 24 hours from that timestamp, re-check initial-block-download behavior before freezing genesis.
- [x] Native private `unitedregtest` chain patch exists.
- [x] Private-regtest two-node mining, wallet, transaction and P2P CI passed (run `42157048924`).
- [x] Public-testnet candidate chain type, identity, genesis and address encodings are implemented in branch `network/united-public-testnet`.
- [x] Independent Python genesis verifier has been added.
- [x] Public-testnet patch applied and CMake configuration succeeded in the latest native runs.
- [ ] Native compile and two-node public-testnet GBT mining, wallet transaction and P2P synchronization pass in the latest workflow.
- [ ] Public network magic, ports, HRP and address prefixes are checked for collisions by independent reviewers.
- [ ] Multiple public seed/bootstrap hosts are deployed and reachable from external networks.
- [ ] An independently operated miner or pool is deployed and can produce valid blocks; CI's Python miner is only a test harness.
- [ ] Reproducible signed binaries, checksums, SBOM and install documentation are published.
- [ ] Full upstream and UNITED-specific consensus/security test suites pass.
- [ ] Independent operator and security reviews are complete.

**Current decision remains NO-GO for public announcement.** Local CI passing does not create publicly reachable nodes. The testnet may be called live only after independent external nodes can connect, produce valid blocks and remain synchronized.
