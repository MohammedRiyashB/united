#!/usr/bin/env python3
"""Small test-only SHA-256d miner for UNITED public-testnet CI.

Uses Bitcoin Core getblocktemplate/submitblock. It is not a production miner,
pool implementation, Stratum client, or optimized mining program.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
import subprocess
import sys
from typing import Any


def sha256d(data: bytes) -> bytes:
    return hashlib.sha256(hashlib.sha256(data).digest()).digest()


def compact_size(value: int) -> bytes:
    if value < 0xFD:
        return bytes([value])
    if value <= 0xFFFF:
        return b"\xfd" + struct.pack("<H", value)
    if value <= 0xFFFFFFFF:
        return b"\xfe" + struct.pack("<I", value)
    return b"\xff" + struct.pack("<Q", value)


def push_data(data: bytes) -> bytes:
    size = len(data)
    if size < 0x4C:
        prefix = bytes([size])
    elif size <= 0xFF:
        prefix = b"\x4c" + bytes([size])
    elif size <= 0xFFFF:
        prefix = b"\x4d" + struct.pack("<H", size)
    else:
        raise ValueError("pushdata too large")
    return prefix + data


def script_number(value: int) -> bytes:
    """Return the minimally encoded CScript integer push for block height."""
    if value == 0:
        return b"\x00"  # OP_0
    if 1 <= value <= 16:
        return bytes([0x50 + value])  # OP_1 ... OP_16
    raw = bytearray()
    n = value
    while n:
        raw.append(n & 0xFF)
        n >>= 8
    if raw[-1] & 0x80:
        raw.append(0)
    return push_data(bytes(raw))


def compact_target(bits: int) -> int:
    size = bits >> 24
    word = bits & 0x007FFFFF
    negative = word != 0 and bool(bits & 0x00800000)
    overflow = word != 0 and (
        size > 34 or (word > 0xFF and size > 33) or (word > 0xFFFF and size > 32)
    )
    if negative or overflow or word == 0 or size < 3:
        raise ValueError(f"invalid compact target: 0x{bits:08x}")
    target = word << (8 * (size - 3))
    if target <= 0:
        raise ValueError("non-positive target")
    return target


def coinbase_transaction(height: int, value: int, script_pubkey: bytes, extra_nonce: int) -> bytes:
    script_sig = script_number(height) + push_data(struct.pack("<I", extra_nonce))
    if not 2 <= len(script_sig) <= 100:
        raise ValueError(f"coinbase scriptSig length out of range: {len(script_sig)}")
    tx = (
        struct.pack("<i", 2)
        + b"\x01"
        + bytes(32)
        + struct.pack("<I", 0xFFFFFFFF)
        + compact_size(len(script_sig))
        + script_sig
        + struct.pack("<I", 0xFFFFFFFF)
        + b"\x01"
        + struct.pack("<q", value)
        + compact_size(len(script_pubkey))
        + script_pubkey
        + struct.pack("<I", 0)
    )
    return tx


def merkle_root(transactions: list[bytes]) -> bytes:
    if not transactions:
        raise ValueError("block must include the coinbase transaction")
    layer = transactions[:]
    while len(layer) > 1:
        if len(layer) & 1:
            layer.append(layer[-1])
        layer = [sha256d(layer[i] + layer[i + 1]) for i in range(0, len(layer), 2)]
    return layer[0]


class BitcoinCLI:
    def __init__(self, args: argparse.Namespace):
        self.args = args
        self.base = [
            args.cli,
            "-chain=unitedtestnet",
            f"-datadir={args.datadir}",
            f"-rpcport={args.rpcport}",
            f"-rpcuser={args.rpcuser}",
            f"-rpcpassword={args.rpcpassword}",
        ]

    def call(self, method: str, *params: str, wallet: str | None = None) -> str:
        command = [*self.base]
        if wallet:
            command.append(f"-rpcwallet={wallet}")
        proc = subprocess.run(
            [*command, method, *params],
            check=False,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        if proc.returncode:
            raise RuntimeError(
                f"bitcoin-cli {method} failed ({proc.returncode}): "
                f"{proc.stderr.strip() or proc.stdout.strip()}"
            )
        return proc.stdout.strip()

    def json(self, method: str, *params: str, wallet: str | None = None) -> dict[str, Any]:
        return json.loads(self.call(method, *params, wallet=wallet))


def mine_one(cli: BitcoinCLI, address: str, wallet: str, height_expected: int) -> str:
    template = cli.json("getblocktemplate", '{"rules":["segwit"]}')
    height = int(template["height"])
    if height != height_expected:
        raise RuntimeError(f"template height {height}; expected {height_expected}")

    address_info = cli.json("getaddressinfo", address, wallet=wallet)
    script_hex = address_info.get("scriptPubKey")
    if not script_hex:
        raise RuntimeError("getaddressinfo did not return scriptPubKey")
    script_pubkey = bytes.fromhex(script_hex)

    mempool_txs = template.get("transactions", [])
    raw_mempool: list[bytes] = []
    leaves: list[bytes] = []
    for tx in mempool_txs:
        if tx.get("txid") is None or tx.get("data") is None:
            raise RuntimeError("template transaction is missing txid/data")
        if tx.get("hash", tx["txid"]) != tx["txid"]:
            raise RuntimeError(
                "witness transactions are not supported by this minimal CI miner; "
                "use legacy testnet addresses and an empty witness mempool"
            )
        raw_mempool.append(bytes.fromhex(tx["data"]))
        leaves.append(bytes.fromhex(tx["txid"])[::-1])

    bits = int(template["bits"], 16)
    target = compact_target(bits)
    version = int(template["version"])
    prev_hash = bytes.fromhex(template["previousblockhash"])[::-1]
    block_time = max(int(template["curtime"]), int(template.get("mintime", 0)))
    coinbase_value = int(template["coinbasevalue"])

    for extra_nonce in range(0, 1_000_000):
        coinbase = coinbase_transaction(height, coinbase_value, script_pubkey, extra_nonce)
        root = merkle_root([sha256d(coinbase), *leaves])
        for time_value in range(block_time, block_time + 3600):
            prefix = (
                struct.pack("<i", version)
                + prev_hash
                + root
                + struct.pack("<II", time_value, bits)
            )
            for nonce in range(0, 0xFFFFFFFF + 1):
                header = prefix + struct.pack("<I", nonce)
                digest = sha256d(header)
                if int.from_bytes(digest, "little") <= target:
                    block = (
                        header
                        + compact_size(1 + len(raw_mempool))
                        + coinbase
                        + b"".join(raw_mempool)
                    )
                    result = cli.call("submitblock", block.hex())
                    if result not in ("", "null", "None"):
                        raise RuntimeError(f"submitblock rejected candidate: {result}")
                    block_hash = cli.call("getblockhash", str(height))
                    print(f"mined height={height} hash={block_hash} nonce={nonce}")
                    return block_hash
            # The loop is deliberately exhaustive; change time after nonce space.
        block_time += 3600
    raise RuntimeError("test miner exhausted its search range")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cli", required=True)
    parser.add_argument("--datadir", required=True)
    parser.add_argument("--rpcport", required=True, type=int)
    parser.add_argument("--rpcuser", required=True)
    parser.add_argument("--rpcpassword", required=True)
    parser.add_argument("--address", required=True)
    parser.add_argument("--wallet", required=True, help="wallet name containing --address")
    parser.add_argument("--blocks", type=int, default=1)
    args = parser.parse_args()
    if args.blocks < 1:
        parser.error("--blocks must be positive")

    cli = BitcoinCLI(args)
    for _ in range(args.blocks):
        height = int(cli.call("getblockcount")) + 1
        mine_one(cli, args.address, args.wallet, height)
    print(cli.call("getblockchaininfo"))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"test miner error: {exc}", file=sys.stderr)
        raise SystemExit(1)
