# UNITED Public Testnet Operator Infrastructure

**Not deployed yet.** These files are deployment templates, not live infrastructure. No official seed IPs or DNS names are published. Do not invent peers or copy endpoints from unrelated networks.

## Minimum bootstrap topology

Before a public testnet announcement, deploy at least two independent nodes:

- Different hosting providers or administrative domains.
- Public inbound TCP P2P port `29446`.
- Same exact UNITED testnet source commit and genesis.
- RPC bound only to loopback/private management.
- Monitoring of uptime, height, peer count, chain-tip time and disk usage.

Once each host is deployed and verified, publish its reachable IP/hostname and add it to the other nodes with `addnode=<peer>:29446`. Only after uptime and peer-exchange tests should those endpoints be promoted into DNS seeds or fixed seeds.

## Install layout

- Node binary: `/usr/local/bin/bitcoind`
- CLI: `/usr/local/bin/bitcoin-cli`
- Config: `/etc/united/unitedtestnet.conf`
- Data: `/var/lib/unitedtestnet`
- Service account: `united`
- Service: `unitedtestnet.service`

Use the example config and systemd unit in this directory. Set unique RPC credentials; never expose TCP `29447` publicly.

## Validate a deployed bootstrap node

After starting the service, check locally:

```bash
bitcoin-cli -conf=/etc/united/unitedtestnet.conf -chain=unitedtestnet -datadir=/var/lib/unitedtestnet getblockhash 0
bitcoin-cli -conf=/etc/united/unitedtestnet.conf -chain=unitedtestnet -datadir=/var/lib/unitedtestnet getblockchaininfo
bitcoin-cli -conf=/etc/united/unitedtestnet.conf -chain=unitedtestnet -datadir=/var/lib/unitedtestnet getnetworkinfo
bitcoin-cli -conf=/etc/united/unitedtestnet.conf -chain=unitedtestnet -datadir=/var/lib/unitedtestnet getpeerinfo
```

Expected genesis:
`0003d0389ed5b8854934bcb977dac8b78c4bc7cd8ea1d3223934a3ba79b033f1`.

A locally running node is not enough. Verify inbound connectivity from a genuinely external machine and check the peer handshake on a second independent operator node before publishing its endpoint.
