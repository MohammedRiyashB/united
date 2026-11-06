# UNITED native patch series

## Patch 0001 — private regtest

`0001-add-united-regtest.patch` adds the private `unitedregtest` chain type to pinned Bitcoin Core v32.1. Its easy PoW target, minimum-difficulty allowance and disabled retargeting are for local development only.

## Patch 0002 — public testnet candidate

`0002-add-united-public-testnet.patch` adds a separate `unitedtestnet` chain type with its own genesis block, P2P magic, ports, address prefixes and Bech32 HRP. It uses SHA-256d, a 600-second target spacing, 14-day retargeting, delayed-block minimum-difficulty support and BIP94 timewarp/block-storm mitigation.

The testnet chain parameters are a **candidate for public testing**, not a finalized or independently audited consensus specification. The network currently has no DNS/fixed seed nodes; nodes must connect through manually configured `-addnode=<peer-ip>:29555` until independent bootstrap infrastructure is deployed and reviewed. Coins are valueless.

Both patches are applied in order by the native CI workflow. Each consensus-affecting change must retain exact upstream context, a rationale, deterministic genesis verification, automated tests and an independent review. Do not reuse the public-testnet parameters as mainnet settings.
