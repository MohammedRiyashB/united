# UNITED Public Testnet — Candidate Operator Guide

**Status: implementation candidate, not a live network.** The native chain type and genesis are in the `network/united-public-testnet` branch and require fresh native CI plus independent review. No public seed nodes or miners are currently deployed. Testnet coins have no value.

## Candidate network identity

| Setting | Value |
|---|---|
| Chain | `unitedtestnet` |
| P2P magic | `fa b1 d0 02` |
| P2P / RPC | `29446 / 29447` |
| Bech32 HRP | `tunit` |
| Base58 pubkey / script / WIF | `75 / 76 / 203` |
| Genesis hash | `00057ebf90a85fff3a45bd543a266d8ed59bc76ee3aadab4fc216416582686d0` |
| Genesis Merkle root | `d913e5cf8a09ccf5d4382c4a1e78d8e8b62c9bc0538240c05b26e2baa1d35446` |
| Subsidy / halving | `50 UNITED / 210,000 blocks` |
| Target spacing / retarget | `600 seconds / 2,016 blocks` |

All coins on this network are valueless test coins. These values are testnet candidates and must not be reused for mainnet.

## Build the candidate node

Requirements: Linux build environment, Git, CMake, Ninja, Python 3, compiler toolchain, libevent, Boost and SQLite development packages.

From a checkout of this branch:

```bash
bash scripts/verify-public-testnet-genesis.py
bash scripts/bootstrap-bitcoin-core.sh .work/bitcoin-core-v32.1
cd .work/bitcoin-core-v32.1
git apply --check ../../core/patches/0001-add-united-regtest.patch
git apply ../../core/patches/0001-add-united-regtest.patch
git apply --check ../../core/patches/0002-add-united-public-testnet.patch
git apply ../../core/patches/0002-add-united-public-testnet.patch
cmake -S . -B build -G Ninja \
  -DBUILD_TESTS=OFF -DBUILD_BENCH=OFF -DBUILD_GUI=OFF \
  -DBUILD_TX=OFF -DBUILD_UTIL=OFF -DENABLE_WALLET=ON \
  -DENABLE_IPC=OFF -DENABLE_EXTERNAL_SIGNER=OFF \
  -DWITH_ZMQ=OFF -DWITH_USDT=OFF
cmake --build build --parallel 2
```

The bootstrap script verifies the pinned v32.1 source and requires the signing key to be independently trusted in the local GPG keyring. Do not bypass a failed signature check.

## Start a node safely

Use a separate data directory and wallet from private regtest and any future mainnet. Keep RPC bound to localhost/private interfaces; never expose wallet RPC on the public internet.

```bash
./build/bin/bitcoind -chain=unitedtestnet -daemon
./build/bin/bitcoin-cli -chain=unitedtestnet getblockchaininfo
./build/bin/bitcoin-cli -chain=unitedtestnet getblockhash 0
./build/bin/bitcoin-cli -chain=unitedtestnet createwallet united-testnet-wallet
./build/bin/bitcoin-cli -chain=unitedtestnet -rpcwallet=united-testnet-wallet getnewaddress
```

A native wallet address should begin with `tunit1`. Confirm the chain name is `unitedtestnet` and the genesis hash matches the table above before sharing a testnet address.

Open inbound TCP port `29446` only when you are intentionally operating a public P2P node. Do not expose RPC port `29447`; use localhost or a private management network.

## Peer connection and current bootstrap limitation

No DNS seed names or fixed seed addresses are configured because no independent seed operators have been provisioned. A node started today will not automatically discover other UNITED testnet nodes.

After an operator independently deploys and publishes a reachable node, connect using:

```bash
./build/bin/bitcoin-cli -chain=unitedtestnet addnode "<operator-host>:29446" onetry
./build/bin/bitcoin-cli -chain=unitedtestnet getpeerinfo
./build/bin/bitcoin-cli -chain=unitedtestnet getconnectioncount
```

Do not substitute made-up hostnames or localhost addresses for public seed infrastructure. At least two independently operated, externally reachable bootstrap nodes are required before the network can be announced as public.

## Mining status

The native node inherits Bitcoin Core's block-template and validation machinery, but this repository does not yet ship a UNITED mining client, Stratum pool or managed miner service. The private-regtest `generatetoaddress` RPC is deliberately not available as a public-testnet mining strategy. A compatible external SHA-256d miner/pool must be configured against the testnet's block-template service before public miners can participate.

Do not claim that blocks are being produced until an independent miner has submitted a valid block and another independent node has accepted it.

## Before calling this a public release

Complete every mandatory item in [PUBLIC_TESTNET_GO_NO_GO.md](PUBLIC_TESTNET_GO_NO_GO.md): independent review of consensus and identifier collisions, bootstrap peers, independent mining, signed/reproducible artifacts, upstream and UNITED-specific tests, operational monitoring and a public soak period. The current CI is only a local two-node smoke test, not evidence of external reachability.
