# UNITED Public Testnet Go/No-Go Checklist

**Current decision: NO-GO.** The repository currently implements a private development regtest only. This checklist defines the evidence required before announcing or distributing a public UNITED testnet.

Testnet coins must be clearly labelled as valueless. Do not accept deposits, sell testnet coins, promise returns, or reuse any mainnet keys, addresses, data directories or credentials.

## Consensus and network identity

- [ ] Publish and freeze a reviewed public-testnet consensus specification.
- [ ] Decide and document the public-testnet PoW limit, target spacing/timespan, retarget algorithm, minimum-difficulty behavior and timestamp rules.
- [ ] Review coinbase maturity, subsidy schedule, money range, block weight and script/transaction activation settings in native C++ code.
- [ ] Generate a testnet-only genesis coinbase and block header deterministically; independently reproduce the exact bytes, Merkle root and SHA-256d hash.
- [ ] Select collision-checked four-byte message magic, P2P/RPC ports, Base58 prefixes and Bech32/Bech32m HRP.
- [ ] Configure independent testnet chain type and data directory. Verify mainnet, testnet and private regtest data cannot be confused.
- [ ] Add positive and negative native consensus vectors, including invalid PoW, invalid compact targets, future timestamps, retarget boundaries, subsidy/money boundaries, invalid scripts, invalid transactions and reorgs.
- [ ] Verify wrong-network nodes reject UNITED testnet blocks and addresses.

## Software validation and supply chain

- [ ] Re-check the upstream release for current support status, security advisories and dependencies.
- [ ] Verify the upstream signed tag with an independently trusted maintainer keyring; record the full commit, signer fingerprint, source hashes and SBOM.
- [ ] Run relevant upstream unit, functional, fuzz and sanitizer suites, not just a successful daemon compilation.
- [ ] Run UNITED-specific two-node/multi-node tests for mining, wallet backup/restore, sends/receives, mempool relay, block sync, disconnections, partitions, restarts and competing-chain reorganization.
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
- [x] Pinned Bitcoin Core v32.1 daemon/CLI compilation succeeded in prior CI.
- [x] Private-regtest genesis hash was verified in the baseline smoke test.
- [ ] Latest corrected genesis timestamp/nonce patch passes a fresh full native CI run.
- [ ] Two-node mining, wallet, transaction and P2P functional CI passes.
- [ ] Full upstream and UNITED-specific consensus/security test suites pass.
- [ ] Public-testnet parameters, genesis, seeds and release artifacts exist.
- [ ] Independent operator and security reviews are complete.

A green CI job for private regtest is necessary but not sufficient to release a public testnet.
