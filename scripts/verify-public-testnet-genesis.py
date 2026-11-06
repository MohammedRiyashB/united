#!/usr/bin/env python3
"""Independently verify the UNITED public-testnet genesis transaction and header."""

from __future__ import annotations

import hashlib
import struct

TIMESTAMP_TEXT = b"UNITED PUBLIC TESTNET GENESIS 2026-11-06"
OUTPUT_TEXT = b"UNITED PUBLIC TESTNET"
GENESIS_TIME = 1_700_000_001
GENESIS_BITS = 0x1F0FFFFF
GENESIS_NONCE = 60
GENESIS_HASH = "00057ebf90a85fff3a45bd543a266d8ed59bc76ee3aadab4fc216416582686d0"
MERKLE_ROOT = "d913e5cf8a09ccf5d4382c4a1e78d8e8b62c9bc0538240c05b26e2baa1d35446"


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
        raise ValueError("genesis pushdata is too large")
    return prefix + data


def compact_target(bits: int) -> int:
    size = bits >> 24
    word = bits & 0x007FFFFF
    if bits & 0x00800000 or word == 0 or size < 3 or size > 32:
        raise ValueError("invalid compact target")
    return word << (8 * (size - 3))


def build_coinbase() -> bytes:
    # Equivalent to CScript() << 486604799 << CScriptNum(4) << timestamp text.
    script_sig = bytes.fromhex("04ffff001d0104") + push_data(TIMESTAMP_TEXT)
    script_pubkey = b"\x6a" + push_data(OUTPUT_TEXT)  # OP_RETURN, unspendable.
    tx = (
        struct.pack("<i", 1)
        + b"\x01"
        + b"\x00" * 32
        + b"\xff\xff\xff\xff"
        + compact_size(len(script_sig))
        + script_sig
        + b"\xff\xff\xff\xff"
        + b"\x01"
        + struct.pack("<q", 50 * 100_000_000)
        + compact_size(len(script_pubkey))
        + script_pubkey
        + b"\x00\x00\x00\x00"
    )
    return tx


def main() -> None:
    coinbase = build_coinbase()
    tx_hash = sha256d(coinbase)
    merkle_display = tx_hash[::-1].hex()
    header = (
        struct.pack("<i", 1)
        + b"\x00" * 32
        + tx_hash
        + struct.pack("<III", GENESIS_TIME, GENESIS_BITS, GENESIS_NONCE)
    )
    if len(header) != 80:
        raise AssertionError(f"header must be 80 bytes, got {len(header)}")
    digest = sha256d(header)
    block_hash = digest[::-1].hex()
    target = compact_target(GENESIS_BITS)
    hash_integer = int.from_bytes(digest[::-1], "big")

    if merkle_display != MERKLE_ROOT:
        raise AssertionError(f"Merkle root mismatch: {merkle_display}")
    if block_hash != GENESIS_HASH:
        raise AssertionError(f"genesis hash mismatch: {block_hash}")
    if hash_integer > target:
        raise AssertionError("genesis header does not satisfy its proof-of-work target")

    print(f"coinbase bytes: {len(coinbase)}")
    print(f"merkle root: {merkle_display}")
    print(f"genesis time: {GENESIS_TIME}")
    print(f"genesis bits: 0x{GENESIS_BITS:08x}")
    print(f"genesis nonce: {GENESIS_NONCE}")
    print(f"genesis hash: {block_hash}")
    print(f"PoW target: {target:064x}")
    print("UNITED public-testnet genesis verification: PASS")


if __name__ == "__main__":
    main()
