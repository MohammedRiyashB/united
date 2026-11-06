# Infrastructure Plan — Not Deployed

No UNITED mainnet or public-testnet infrastructure is deployed. The public-testnet chain candidate has no DNS/fixed seed nodes yet and currently requires manual `-addnode` peering.

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

## Public-testnet bootstrap requirements

- Deploy at least two independently operated, monitored bootstrap peers on P2P port 29555.
- Confirm each peer runs the exact public-testnet genesis and candidate chain parameters.
- Publish verified peer endpoints only after uptime, peer exchange and restart/recovery tests.
- Keep RPC private; expose only the P2P listener to the internet.

## Pre-mainnet infrastructure evidence

Publish node operator requirements, seed list ownership, infrastructure status, monitoring/incident process, backup/recovery tests and a public health dashboard only after the corresponding services exist and are independently verified.
