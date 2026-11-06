#!/usr/bin/env python3
"""Independent UNITED public-testnet genesis serialization and PoW verifier.

Uses only Python's standard library. The values here must match the native
CChainParams constants exactly; changing any field changes the genesis hash.
"""
import hashlib
import struct
import sys

TIMESTAMP = b"UNITED public testnet genesis - test coins have no monetary value"
GENESIS_TIME = 1_735_689_600
GENESIS_BITS = 0x1E0FFFFF
GENESIS_NONCE = 1_129_160
EXPECTED_MERKLE = "3184f943619d506bdc6af367ba93346790766eaa244fdff3989df0a020975256"
EXPECTED_HASH = "00000f7003bea5babbc9b271415f351472e51edd3d34e798214f6734b8d27da9"
EXPECTED_POW_LIMIT = int("00000fffff000000000000000000000000000000000000000000000000000000", 16)

def sha256d(data: bytes) -> bytes:
    return hashlib.sha256(hashlib.sha256(data).digest()).digest()

def compact_size(n: int) -> bytes:
    if n < 253:
        return bytes([n])
    if n <= 0xFFFF:
        return b"\xfd" + struct.pack("<H", n)
    if n <= 0xFFFFFFFF:
        return b"\xfe" + struct.pack("<I", n)
    return b"\xff" + struct.pack("<Q", n)

def push(data: bytes) -> bytes:
    if len(data) < 76:
        return bytes([len(data)]) + data
    raise ValueError("unexpected genesis script push length")

# CScript() << 486604799 << CScriptNum(4) << timestamp
script_sig = push(bytes.fromhex("ffff001d")) + b"\x54" + push(TIMESTAMP)
pubkey = bytes.fromhex(
    "04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61"
    "deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f"
)
script_pubkey = push(pubkey) + b"\xac"
coinbase = (
    struct.pack("<i", 1)
    + b"\x01"
    + b"\x00" * 32
    + b"\xff" * 4
    + compact_size(len(script_sig))
    + script_sig
    + b"\xff" * 4
    + b"\x01"
    + struct.pack("<q", 50 * 100_000_000)
    + compact_size(len(script_pubkey))
    + script_pubkey
    + struct.pack("<I", 0)
)
merkle = sha256d(coinbase)[::-1].hex()
if merkle != EXPECTED_MERKLE:
    raise SystemExit(f"Merkle mismatch: {merkle}")

header = (
    struct.pack("<i", 1)
    + b"\x00" * 32
    + bytes.fromhex(merkle)[::-1]
    + struct.pack("<III", GENESIS_TIME, GENESIS_BITS, GENESIS_NONCE)
)
if len(header) != 80:
    raise SystemExit(f"Bad header size: {len(header)}")
digest = sha256d(header)
block_hash = digest[::-1].hex()
if block_hash != EXPECTED_HASH:
    raise SystemExit(f"Genesis hash mismatch: {block_hash}")

exponent = GENESIS_BITS >> 24
mantissa = GENESIS_BITS & 0x007FFFFF
target = mantissa << (8 * (exponent - 3))
if target != EXPECTED_POW_LIMIT:
    raise SystemExit(f"PoW limit mismatch: {target:064x}")
if int.from_bytes(digest, "little") > target:
    raise SystemExit("Genesis header does not satisfy its proof-of-work target")

print(f"Genesis merkle root: {merkle}")
print(f"Genesis block hash:  {block_hash}")
print(f"Genesis time:       {GENESIS_TIME}")
print(f"Genesis bits:       0x{GENESIS_BITS:08x}")
print(f"Genesis nonce:      {GENESIS_NONCE}")
print("SHA-256d proof of work: VALID")
