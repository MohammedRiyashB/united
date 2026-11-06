#!/usr/bin/env bash
# Install a verified UNITED public-testnet node bundle on Ubuntu 24.04.
# Run as root: bash install-node.sh ./united-testnet-linux-x86_64-<commit>.tar.gz
set -Eeuo pipefail

usage() {
  echo "Usage: sudo bash install-node.sh <verified-node-bundle.tar.gz>" >&2
}

if [[ "$#" -ne 1 ]]; then usage; exit 2; fi
if [[ "\${EUID}" -ne 0 ]]; then
  echo "ERROR: run this installer with sudo/root." >&2
  exit 1
fi

for tool in tar sha256sum openssl systemctl install runuser; do
  command -v "$tool" >/dev/null 2>&1 || {
    echo "ERROR: required command not found: $tool" >&2
    exit 1
  }
done

archive="$(realpath "$1")"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
tar -xzf "$archive" -C "$work"
cd "$work"

[[ -s SHA256SUMS ]] || {
  echo "ERROR: bundle has no SHA256SUMS file." >&2
  exit 1
}
sha256sum --strict --check SHA256SUMS

for required in bin/bitcoind bin/bitcoin-cli etc/united/unitedtestnet.conf.example lib/systemd/system/unitedtestnet.service share/united/testnet-cpu-miner.py; do
  [[ -s "$required" ]] || {
    echo "ERROR: bundle is missing $required" >&2
    exit 1
  }
done

expected_genesis="0003d0389ed5b8854934bcb977dac8b78c4bc7cd8ea1d3223934a3ba79b033f1"
if systemctl is-active --quiet unitedtestnet.service; then
  echo "ERROR: unitedtestnet.service is already active; refusing to replace a running node." >&2
  exit 1
fi
if [[ -e /etc/united/unitedtestnet.conf ]]; then
  echo "ERROR: /etc/united/unitedtestnet.conf already exists; refusing to overwrite operator configuration." >&2
  exit 1
fi

getent group united >/dev/null || groupadd --system united
if ! id united >/dev/null 2>&1; then
  useradd --system --gid united --home-dir /var/lib/unitedtestnet --shell /usr/sbin/nologin united
fi

install -d -o root -g united -m 0750 /etc/united
install -d -o united -g united -m 0750 /var/lib/unitedtestnet
install -m 0755 bin/bitcoind /usr/local/bin/bitcoind
install -m 0755 bin/bitcoin-cli /usr/local/bin/bitcoin-cli
install -d -o root -g root -m 0755 /usr/local/libexec/united
install -m 0755 share/united/testnet-cpu-miner.py /usr/local/libexec/united/testnet-cpu-miner.py
install -m 0644 lib/systemd/system/unitedtestnet.service /etc/systemd/system/unitedtestnet.service

rpc_user="united-$(openssl rand -hex 8)"
rpc_password="$(openssl rand -hex 32)"
cat > /etc/united/unitedtestnet.conf <<EOF
[unitedtestnet]
server=1
listen=1
daemon=0
discover=1
dnsseed=0
fixedseeds=0
upnp=0
natpmp=0
listenonion=0
port=29446
maxconnections=128

# RPC stays on loopback. Never publish port 29447.
rpcport=29447
rpcbind=127.0.0.1
rpcallowip=127.0.0.1
rpcuser=$rpc_user
rpcpassword=$rpc_password
EOF
chown root:united /etc/united/unitedtestnet.conf
chmod 0640 /etc/united/unitedtestnet.conf

systemctl daemon-reload
systemctl enable --now unitedtestnet.service

actual_genesis=""
for attempt in $(seq 1 30); do
  actual_genesis="$(runuser -u united -- /usr/local/bin/bitcoin-cli \
    -conf=/etc/united/unitedtestnet.conf -chain=unitedtestnet \
    -datadir=/var/lib/unitedtestnet getblockhash 0 2>/dev/null || true)"
  [[ "$actual_genesis" == "$expected_genesis" ]] && break
  sleep 1
done
if [[ "$actual_genesis" != "$expected_genesis" ]]; then
  echo "ERROR: node did not report the expected UNITED testnet genesis." >&2
  echo "Expected: $expected_genesis" >&2
  echo "Actual:   ${actual_genesis:-<no RPC response>}" >&2
  journalctl -u unitedtestnet.service -n 80 --no-pager >&2 || true
  systemctl stop unitedtestnet.service || true
  exit 1
fi

echo
echo "UNITED public-testnet node installed and genesis-verified."
echo "Expected genesis: $expected_genesis"
echo "Service: systemctl status unitedtestnet.service"
echo "P2P listener: TCP 29446 (allow inbound at host and cloud firewall)."
echo "RPC: TCP 29447 bound to 127.0.0.1 only; do not open it."
echo
echo "Verify the node:"
echo "  sudo -u united /usr/local/bin/bitcoin-cli -conf=/etc/united/unitedtestnet.conf -chain=unitedtestnet -datadir=/var/lib/unitedtestnet getblockhash 0"
echo "  sudo -u united /usr/local/bin/bitcoin-cli -conf=/etc/united/unitedtestnet.conf -chain=unitedtestnet -datadir=/var/lib/unitedtestnet getblockchaininfo"
