#!/usr/bin/env python3
"""Independently verify the UNITED public-testnet genesis transaction and header."""
from __future__ import annotations

import hashlib
import struct
import sys

TIMESTAMP_SCRIPT = b"UNITED public testnet genesis - valueless coins - 2026"
PUBKEY = bytes.fromhex(
    "04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb6"
    "49f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f"
)
GENESIS_TIME = 1767225600
GENESIS_BITS = 0x1F00FFFF
GENESIS_NONCE = 15174
EXPECTED_MERKLE = "63ba230a57da664d056cb02ed1dc34bd83a0c774bc1c7421ac6474ad97cf82ff"
EXPECTED_HASH = "00003b8e20fef32b7abc0c295c9bbce1931bc53f5688aeeb75301b997ba6bd00"


def sha256d(data: bytes) -> bytes:
    return hashlib.sha256(hashlib.sha256(data).digest()).digest()


def serialize_coinbase() -> bytes:
    # Matches Bitcoin Core CreateGenesisBlock:
    # CScript() << 486604799 << CScriptNum(4) << timestamp.
    script_sig = b"\x04\xff\xff\x00\x1d\x01\x04" + bytes([len(TIMESTAMP_SCRIPT)]) + TIMESTAMP_SCRIPT
    script_pubkey = bytes([len(PUBKEY)]) + PUBKEY + b"\xac"
    return (
        struct.pack("<i", 1)
        + b"\x01"
        + bytes(32)
        + struct.pack("<I", 0xFFFFFFFF)
        + bytes([len(script_sig)])
        + script_sig
        + struct.pack("<I", 0xFFFFFFFF)
        + b"\x01"
        + struct.pack("<Q", 50 * 100_000_000)
        + bytes([len(script_pubkey)])
        + script_pubkey
        + struct.pack("<I", 0)
    )


def main() -> int:
    tx = serialize_coinbase()
    merkle = sha256d(tx)
    header = (
        struct.pack("<i", 1)
        + bytes(32)
        + merkle
        + struct.pack("<III", GENESIS_TIME, GENESIS_BITS, GENESIS_NONCE)
    )
    digest = sha256d(header)
    displayed_merkle = merkle[::-1].hex()
    displayed_hash = digest[::-1].hex()

    exponent = GENESIS_BITS >> 24
    mantissa = GENESIS_BITS & 0x007FFFFF
    target = mantissa << (8 * (exponent - 3))
    hash_integer = int.from_bytes(digest, "little")

    checks = {
        "Merkle root": displayed_merkle == EXPECTED_MERKLE,
        "Block hash": displayed_hash == EXPECTED_HASH,
        "Proof of work": hash_integer <= target,
        "Compact target": GENESIS_BITS == 0x1F00FFFF,
    }
    for name, ok in checks.items():
        print(f"{name}: {'OK' if ok else 'FAILED'}")
    print(f"Genesis hash: {displayed_hash}")
    print(f"Merkle root: {displayed_merkle}")
    print(f"Nonce: {GENESIS_NONCE}")
    print(f"nBits: 0x{GENESIS_BITS:08x}")
    print(f"Time (Unix): {GENESIS_TIME}")
    if not all(checks.values()):
        return 1
    print("UNITED public-testnet genesis verification passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
