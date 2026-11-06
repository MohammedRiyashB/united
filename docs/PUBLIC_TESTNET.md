# UNITED Public Testnet — Candidate Operator Guide

<badge color="warning">Candidate build only — not a public launch</badge>

The `unitedtestnet` native chain type is being added in branch `feature/united-public-testnet`. This guide documents the candidate parameters and the safe manual-peering procedure. Do not use testnet coins as money; they have no value.

## Candidate network identity

| Parameter | Candidate value |
|---|---|
| Chain type | `unitedtestnet` |
| P2P message magic | `75 6e 74 31` (`unt1`) |
| P2P port | `29555` |
| RPC port | `29554` (local/private only) |
| Bech32 HRP | `unt` (addresses begin `unt1`) |
| Base58 pubkey/script/secret | `85 / 86 / 213` |
| Block interval / retarget interval | 10 minutes / 2,016 blocks |
| Difficulty timespan | 14 days |
| PoW | SHA-256d |
| Testnet minimum-difficulty rule | Enabled for delayed blocks |
| Retargeting | Enabled |
| Initial subsidy / halving | 50 UNITED / 210,000 blocks |
| Premine | 0 |

Candidate genesis:

- Time: `1767225600` (2026-01-01 00:00:00 UTC)
- Nonce: `15174`
- `nBits`: `0x1f00ffff`
- Merkle root: `63ba230a57da664d056cb02ed1dc34bd83a0c774bc1c7421ac6474ad97cf82ff`
- Block hash: `00003b8e20fef32b7abc0c295c9bbce1931bc53f5688aeeb75301b997ba6bd00`

These parameters are implementation candidates. Independent consensus review, external identifier collision review, native CI, and release approval are still required.

## 1. Build the native node

Use a supported Linux host with Git, GPG, CMake, Ninja, a C++ toolchain, Python 3, Boost, libevent and SQLite development packages. Before building, independently verify the Bitcoin Core v32.1 release signer fingerprint. The bootstrap script checks the pinned tag/commit and runs `git verify-tag`; do not bypass signature verification.

Example dependency installation on Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y build-essential cmake ninja-build pkg-config python3 libevent-dev libboost-dev libsqlite3-dev
```

Build both UNITED chain types and the wallet-enabled native daemon/CLI:

```bash
bash scripts/build-united-node.sh
```

The script refuses to overwrite an existing working directory. Its default output is under `.work/bitcoin-core-v32.1-united/build/bin/`.

## 2. Run a public-testnet candidate node

Obtain a peer endpoint from a trusted operator. **No official DNS/fixed seeds or bootstrap servers are deployed yet.** Do not invent or trust an IP address from an unverified chat message.

Set the path to the built binaries:

```bash
BIN="$PWD/.work/bitcoin-core-v32.1-united/build/bin"
DATADIR="$HOME/.unitedtestnet"
```

Start with one or more independently verified peers:

```bash
"$BIN/bitcoind" -chain=unitedtestnet -datadir="$DATADIR" \
  -addnode="<verified-peer-ip>:29555" -daemonwait=1
```

Or add a peer after startup:

```bash
"$BIN/bitcoin-cli" -chain=unitedtestnet -datadir="$DATADIR" \
  addnode "<verified-peer-ip>:29555" "onetry"
```

Allow inbound P2P traffic on TCP port 29555 only when you intend to operate a reachable peer. Keep RPC port 29554 bound to localhost or a private management network. Never expose wallet/admin RPC to the public internet.

## 3. Verify network identity

```bash
"$BIN/bitcoin-cli" -chain=unitedtestnet -datadir="$DATADIR" getblockhash 0
"$BIN/bitcoin-cli" -chain=unitedtestnet -datadir="$DATADIR" getblockchaininfo
"$BIN/bitcoin-cli" -chain=unitedtestnet -datadir="$DATADIR" getconnectioncount
"$BIN/bitcoin-cli" -chain=unitedtestnet -datadir="$DATADIR" getnewaddress
```

The genesis hash must equal the candidate value above. New Bech32 addresses should use the `unt1` HRP. Verify all values against the exact source commit you built.

## 4. Wallet and mining checks

The daemon includes Bitcoin Core's native wallet and mining RPC machinery. The candidate CI tests wallet creation, 101-block mining, coinbase maturity, transaction relay and confirmation between two local nodes. Those are software integration tests, not a production mining pool or public mining service.

No public pool, independent miner fleet, explorer, mobile wallet or public API is currently deployed. Do not send valuable funds or advertise testnet coins as having monetary value.

Stop the node:

```bash
"$BIN/bitcoin-cli" -chain=unitedtestnet -datadir="$DATADIR" stop
```

## Release blockers

This guide does not mean the public network is live. Before inviting public users, the project still needs a passing native public-testnet CI run, independently reviewed consensus/network parameters, several real bootstrap peers, independent node/miner operators, reproducible signed binaries and checksums, monitoring, vulnerability reporting, a sustained testnet soak, and public go/no-go approval.
