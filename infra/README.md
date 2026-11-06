# Infrastructure Plan — Not Deployed

No UNITED production infrastructure currently exists.

## Planned roles

- Bootstrap/seed nodes: peer discovery only; peers still validate all blocks.
- Independent full nodes: operated by unrelated maintainers and community members.
- Archival nodes: retain full block data for historical access.
- Mining nodes and pools: separate from explorer and wallet infrastructure.
- Indexers/explorers: rebuildable read models sourced from full nodes.
- Monitoring: metrics and alerting for chain health, reorgs, peer diversity, disk and node uptime.

## Operational separation

- Do not expose node wallet/admin RPC to the public internet.
- Keep signing keys and release keys offline and separate from servers.
- Do not put wallet private keys in containers, environment files, logs or dashboards.
- Use separate accounts, networks and credentials for mainnet/testnet/regtest.
- Make indexers disposable and rebuildable; never treat their database as consensus state.
- Ensure seed infrastructure is geographically and administratively diverse.

## Pre-mainnet infrastructure evidence

Publish node operator requirements, seed list ownership, infrastructure status, monitoring/incident process, backup/recovery tests and a public health dashboard only after the corresponding services exist and are independently verified.

## Public-testnet deployment templates

The candidate deployment layout is in [`infra/public-testnet/`](public-testnet/README.md):
- `unitedtestnet.conf.example` keeps RPC on loopback and opens the separate P2P listener.
- `unitedtestnet.service` runs the node under a dedicated non-root `united` account.

These are templates only. No host, IP, DNS seed or bootstrap service is deployed by this repository. Provision at least two independent public peers, verify each exact genesis and external reachability, then publish their real endpoints. Never expose RPC port 29447.
