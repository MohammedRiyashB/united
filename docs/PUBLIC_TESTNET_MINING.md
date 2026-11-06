# UNITED Public Testnet — Solo CPU Mining

**Status: experimental testnet miner.** The bundled Python miner submits SHA-256d blocks to a local UNITED node through Bitcoin Core's \`getblocktemplate\` and \`submitblock\` RPCs. It is a simple, single-process CPU miner for bootstrapping and testing. It is not an optimized ASIC miner, Stratum client, pool, or production mining service.

All UNITED public-testnet coins are valueless test coins. Never send real funds or pay anyone for testnet UNITED.

## Requirements

- An independently running \`unitedtestnet\` full node built from the same approved source commit.
- At least one reachable peer so blocks propagate to the rest of the network.
- Python 3 (standard library only).
- A wallet created on the local node and a \`tunit1...\` payout address.
- Run the miner as the same operating-system user as the node. This allows \`bitcoin-cli\` to use the node's local authentication cookie without placing an RPC password in command-line arguments.

## Prepare the node and wallet

On a node installed with \`infra/public-testnet/install-node.sh\`:

\`\`\`bash
sudo -u united /usr/local/bin/bitcoin-cli \\
  -conf=/etc/united/unitedtestnet.conf \\
  -chain=unitedtestnet -datadir=/var/lib/unitedtestnet \\
  getblockhash 0

sudo -u united /usr/local/bin/bitcoin-cli \\
  -conf=/etc/united/unitedtestnet.conf \\
  -chain=unitedtestnet -datadir=/var/lib/unitedtestnet \\
  createwallet united-testnet-miner

sudo -u united /usr/local/bin/bitcoin-cli \\
  -conf=/etc/united/unitedtestnet.conf \\
  -chain=unitedtestnet -datadir=/var/lib/unitedtestnet \\
  -rpcwallet=united-testnet-miner getnewaddress "" bech32
\`\`\`

Verify the genesis hash is:

\`0003d0389ed5b8854934bcb977dac8b78c4bc7cd8ea1d3223934a3ba79b033f1\`

Save the returned \`tunit1...\` address as your payout address.

## Connect to another public node

Once an operator has supplied a verified public IP or hostname, add that peer:

\`\`\`bash
sudo -u united /usr/local/bin/bitcoin-cli \\
  -conf=/etc/united/unitedtestnet.conf \\
  -chain=unitedtestnet -datadir=/var/lib/unitedtestnet \\
  addnode "<verified-peer-host-or-ip>:29446" add

sudo -u united /usr/local/bin/bitcoin-cli \\
  -conf=/etc/united/unitedtestnet.conf \\
  -chain=unitedtestnet -datadir=/var/lib/unitedtestnet \\
  getpeerinfo
\`\`\`

Do not use example domains or unverified endpoints. The project currently has no official DNS seeds. Keep public inbound TCP port 29446 open and keep RPC port 29447 restricted to loopback.

## Mine one block

Replace the example address below with your own payout address:

\`\`\`bash
sudo -u united python3 /usr/local/libexec/united/testnet-cpu-miner.py \\
  --cli /usr/local/bin/bitcoin-cli \\
  --datadir /var/lib/unitedtestnet \\
  --conf /etc/united/unitedtestnet.conf \\
  --rpcport 29447 \\
  --address "tunit1_REPLACE_WITH_YOUR_ADDRESS" \\
  --wallet united-testnet-miner \\
  --blocks 1
\`\`\`

The miner reads the generated RPC username and password from the node configuration file supplied with `--conf`. Keep that file readable only by the node service account and trusted administrators. Do not expose its credentials. Do not add \`--rpcuser\` or \`--rpcpassword\` unless you deliberately use non-cookie RPC authentication.

After it reports a mined block, verify propagation from the second independent node:

\`\`\`bash
sudo -u united /usr/local/bin/bitcoin-cli \\
  -conf=/etc/united/unitedtestnet.conf \\
  -chain=unitedtestnet -datadir=/var/lib/unitedtestnet \\
  getblockcount
\`\`\`

The second node should reach the same height and report the same block hash at the new height. Coinbase rewards require 100 confirmations before they can be spent.

## Limitations and safety

- The miner is single-process Python and will be much slower than optimized SHA-256d ASIC software.
- There is no Stratum pool or public mining coordinator. Each miner runs against its own node.
- A miner must refresh its work when another node finds a block. This implementation obtains a fresh template for each submitted block.
- Do not mine on an isolated node and count that as public network activity. Confirm another independent node receives the block.
- Do not expose RPC port 29447, wallet RPC, RPC credentials, or cookie files to the internet.
- This is testnet software. No token has market value and no mining reward is promised.

For production-scale mining and third-party ASIC participation, the network still needs a separately reviewed Stratum pool, monitoring, abuse controls, and independent operator testing.
