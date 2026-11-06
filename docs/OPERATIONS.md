# UNITED Node Operations — Draft

## Development and test environments

- Use regtest for local protocol work.
- Use testnet for public integration and wallet/mining testing.
- Never reuse production credentials, signing keys or data directories across networks.
- Testnet coins are valueless and must be clearly labelled.

## UNITED public-testnet candidate

The `unitedtestnet` candidate uses P2P port `29555`, RPC port `29554`, message magic `756e7431`, and Bech32 HRP `unt`. It currently has **no DNS seeds or fixed seeds**. An operator must obtain a verified peer endpoint from the project maintainers and add it manually using `-addnode=<peer-ip>:29555`. Do not invent or publish an IP address that is not actually operated and reachable.

The candidate should not be announced as a live public testnet until native two-node CI passes, multiple independent peers are online, the genesis/network parameters are independently reviewed, and signed release artifacts and operator documentation are published. Testnet coins have no value.

Example command shape after building the patched node:

```bash
bitcoind -chain=unitedtestnet -addnode=<verified-peer-ip>:29555
```

Keep RPC bound to localhost/private interfaces. Never expose wallet/admin RPC to the public internet.

## Full-node operator baseline

- Dedicated supported Linux host; non-root service account.
- Keep OS and node packages patched.
- Persist blockchain data on monitored storage with capacity alerts.
- Restrict P2P and RPC ports separately; do not expose wallet/admin RPC publicly.
- Monitor chain tip age, peer count/diversity, reorg depth, disk, CPU, memory and process restarts.
- Back up configuration and operational metadata; chain data can be re-synced from independently verified peers.

## Release process

1. Freeze source commit and dependencies.
2. Verify upstream signatures and release provenance.
3. Build in a reproducible environment.
4. Run unit, integration, fuzz regression, sanitizer and consensus-vector tests.
5. Have a second maintainer verify artifacts and checksums.
6. Sign releases with an offline-controlled key.
7. Publish source, binaries, checksums, SBOM and verification instructions.
8. Monitor upgrades and provide rollback instructions for non-consensus services. Never silently roll back consensus state.

## Mainnet operational rule

No production seed nodes, public mining pools or wallet endpoints should be represented as UNITED Mainnet until the go/no-go document is completed and genesis parameters are frozen publicly.
