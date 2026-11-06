# UNITED Public Testnet Operator Infrastructure

**Deployment status: templates and installer prepared; no public nodes are deployed by this repository.** There are no official peer IP addresses or DNS seeds yet. Never invent endpoints or publish a private RPC address.

## Required topology

Before announcing the network, operate at least two externally reachable full nodes in different failure domains. Prefer different hosting providers and independent operators. Each node must run the same approved source commit and report the exact genesis hash below.

| Setting | Value |
|---|---|
| OS for current binary bundle | Ubuntu 24.04 x86_64 |
| Chain | `unitedtestnet` |
| Genesis | `0003d0389ed5b8854934bcb977dac8b78c4bc7cd8ea1d3223934a3ba79b033f1` |
| Public P2P | TCP 29446 |
| RPC | TCP 29447, loopback only |
| Address HRP | `tunit` |

## Get the node package

After the native GitHub Actions workflow passes on the candidate branch:

1. Open the successful run in the repository's **Actions** tab.
2. Download the `united-testnet-linux-x86_64-<commit>` artifact.
3. Verify the detached archive checksum before extracting:

```bash
sha256sum -c united-testnet-linux-x86_64-<commit>.tar.gz.sha256
mkdir -p /tmp/united-testnet-bundle
tar -xzf united-testnet-linux-x86_64-<commit>.tar.gz -C /tmp/united-testnet-bundle
```

The package contains `bitcoind`, `bitcoin-cli`, the experimental solo CPU miner, the systemd unit, the installer, operator guides, build metadata and per-file SHA256 checksums. It is a CI build artifact, not an offline-signed or audited production release.

## Install on each independent Ubuntu 24.04 x86_64 server

Run the installer on each server separately:

```bash
cd /tmp/united-testnet-bundle
sudo bash ./install-node.sh /path/to/united-testnet-linux-x86_64-<commit>.tar.gz
```

The installer verifies the package checksums, creates a dedicated non-root service account, generates unique RPC credentials, binds RPC to loopback only, starts the systemd service and verifies the genesis hash. It refuses to overwrite an existing operator configuration.

Check the node:

```bash
sudo systemctl status unitedtestnet.service
sudo -u united /usr/local/bin/bitcoin-cli -conf=/etc/united/unitedtestnet.conf -chain=unitedtestnet -datadir=/var/lib/unitedtestnet getblockchaininfo
sudo -u united /usr/local/bin/bitcoin-cli -conf=/etc/united/unitedtestnet.conf -chain=unitedtestnet -datadir=/var/lib/unitedtestnet getnetworkinfo
```

## Firewall and peer connection

Open **inbound TCP 29446 only** in both the operating-system firewall and the cloud provider's security group. For example, when UFW is enabled:

```bash
sudo ufw allow 29446/tcp
```

Do **not** open TCP 29447. RPC is for local administration and mining only.

From a genuinely external third machine, test each advertised P2P address:

```bash
nc -vz <node-1-public-ip> 29446
nc -vz <node-2-public-ip> 29446
```

Then add each other node from both ends, substituting the real verified public IPs:

```bash
sudo -u united /usr/local/bin/bitcoin-cli -conf=/etc/united/unitedtestnet.conf -chain=unitedtestnet -datadir=/var/lib/unitedtestnet addnode "<other-node-public-ip>:29446" add
sudo -u united /usr/local/bin/bitcoin-cli -conf=/etc/united/unitedtestnet.conf -chain=unitedtestnet -datadir=/var/lib/unitedtestnet getpeerinfo
```

Both nodes must show a successful peer connection, the same genesis, and the same best height and block hash after blocks are mined. An open TCP port alone is not proof of a valid UNITED P2P handshake.

## Mining and block propagation

The package includes an experimental single-process solo CPU GBT miner. Follow [PUBLIC_TESTNET_MINING.md](../../docs/PUBLIC_TESTNET_MINING.md). Mine on node 1 and verify node 2 receives the exact same new block hash. A founder-only local mining test is not enough; at least one independent operator must repeat the process.

## Security and launch gates

- Keep `rpcbind=127.0.0.1`, `rpcallowip=127.0.0.1`, RPC credentials and cookie files private.
- Never run the daemon as root; the systemd unit uses the dedicated `united` account.
- Do not use mainnet keys, wallets or data directories.
- Do not publish peer IPs until the nodes have been externally tested and operators consent to publication.
- Testnet coins are valueless. Do not accept deposits or promise a market value.
- The network remains **NO-GO for public announcement** until external P2P, independent mining, review, monitoring and soak requirements in [PUBLIC_TESTNET_GO_NO_GO.md](../../docs/PUBLIC_TESTNET_GO_NO_GO.md) have evidence.
