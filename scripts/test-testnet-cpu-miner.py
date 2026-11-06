#!/usr/bin/env python3
"""Offline unit tests for the UNITED testnet CI miner."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("testnet-cpu-miner.py")
SPEC = importlib.util.spec_from_file_location("united_testnet_cpu_miner", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"could not load miner module: {MODULE_PATH}")
MINER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MINER)


class TestCompactTarget(unittest.TestCase):
    def test_candidate_target(self) -> None:
        target = MINER.compact_target(0x1F0FFFFF)
        self.assertEqual(
            target,
            int("000fffff00000000000000000000000000000000000000000000000000000000", 16),
        )

    def test_rejects_invalid_targets(self) -> None:
        for bits in (0, 0x1F80FFFF, 0x23000001):
            with self.subTest(bits=hex(bits)):
                with self.assertRaises(ValueError):
                    MINER.compact_target(bits)


class TestScriptsAndMerkle(unittest.TestCase):
    def test_height_script_number_is_minimal(self) -> None:
        self.assertEqual(MINER.script_number(1), b"\x51")
        self.assertEqual(MINER.script_number(16), b"\x60")
        self.assertEqual(MINER.script_number(17), b"\x01\x11")
        self.assertEqual(MINER.script_number(128), b"\x02\x80\x00")

    def test_merkle_root_duplicates_odd_leaf(self) -> None:
        a = bytes.fromhex("11" * 32)
        b = bytes.fromhex("22" * 32)
        self.assertEqual(
            MINER.merkle_root([a, b, a]),
            MINER.sha256d(MINER.sha256d(a + b) + MINER.sha256d(a + a)),
        )


class TestCoinbaseSerialization(unittest.TestCase):
    def setUp(self) -> None:
        self.payout_script = bytes.fromhex("76a914" + "11" * 20 + "88ac")
        witness_root = MINER.merkle_root([bytes(32)])
        commitment = MINER.sha256d(witness_root + bytes(32))
        self.commitment_script = bytes.fromhex("6a24aa21a9ed") + commitment

    def test_coinbase_has_stripped_and_witness_serializations(self) -> None:
        stripped, full = MINER.coinbase_transaction(
            height=101,
            value=50 * 100_000_000,
            payout_script=self.payout_script,
            witness_commitment_script=self.commitment_script,
            extra_nonce=1,
        )
        self.assertTrue(stripped.startswith(bytes.fromhex("02000000")))
        self.assertTrue(full.startswith(bytes.fromhex("020000000001")))
        self.assertNotEqual(MINER.sha256d(stripped), MINER.sha256d(full))
        self.assertEqual(full[-38:-36], b"\x01\x20")
        self.assertEqual(full[-32:], bytes(32))

    def test_rejects_bad_witness_commitment_script(self) -> None:
        with self.assertRaises(ValueError):
            MINER.coinbase_transaction(
                height=101,
                value=50 * 100_000_000,
                payout_script=self.payout_script,
                witness_commitment_script=b"bad",
                extra_nonce=1,
            )

    def test_witness_commitment_matches_coinbase_reserved_value(self) -> None:
        tx1 = MINER.coinbase_transaction(
            height=101,
            value=50 * 100_000_000,
            payout_script=self.payout_script,
            witness_commitment_script=self.commitment_script,
            extra_nonce=1,
        )
        tx2 = MINER.coinbase_transaction(
            height=101,
            value=50 * 100_000_000,
            payout_script=self.payout_script,
            witness_commitment_script=self.commitment_script,
            extra_nonce=2,
        )
        # The witness tree does not include the coinbase txid; its leaf is zero.
        root = MINER.merkle_root([bytes(32)])
        self.assertEqual(self.commitment_script[6:], MINER.sha256d(root + bytes(32)))
        # Different extranonces alter the normal txid but not the witness commitment.
        self.assertNotEqual(MINER.sha256d(tx1[0]), MINER.sha256d(tx2[0]))
        self.assertEqual(self.commitment_script[6:], MINER.sha256d(root + bytes(32)))


if __name__ == "__main__":
    unittest.main(verbosity=2)
