package pow

import (
	"errors"
	"math/big"
	"testing"
)

func TestCompactToTargetRegtest(t *testing.T) {
	got, err := CompactToTarget(0x207fffff)
	if err != nil {
		t.Fatal(err)
	}
	want := new(big.Int).Lsh(big.NewInt(0x7fffff), 8*(0x20-3))
	if got.Cmp(want) != 0 {
		t.Fatalf("target mismatch: got %x want %x", got, want)
	}
}

func TestCompactToTargetRejectsInvalid(t *testing.T) {
	for _, bits := range []uint32{0, 0x1d80ffff, 0x23000001} {
		if _, err := CompactToTarget(bits); !errors.Is(err, ErrInvalidCompactTarget) {
			t.Errorf("CompactToTarget(%08x) error = %v", bits, err)
		}
	}
}

func TestRegtestMiningAndVerification(t *testing.T) {
	limit, err := CompactToTarget(0x207fffff)
	if err != nil {
		t.Fatal(err)
	}
	header := Header{Version: 1, Timestamp: 1_800_000_000, Bits: 0x207fffff}
	mined, err := Mine(header, limit, 0)
	if err != nil {
		t.Fatal(err)
	}
	if err := CheckProof(mined, limit); err != nil {
		t.Fatalf("mined header failed verification: %v", err)
	}
}

func TestRejectsTargetAbovePowLimit(t *testing.T) {
	limit, _ := CompactToTarget(0x207ffffe)
	header := Header{Bits: 0x207fffff}
	if err := CheckProof(header, limit); !errors.Is(err, ErrTargetAboveLimit) {
		t.Fatalf("expected target-above-limit error, got %v", err)
	}
	if _, err := Mine(header, limit, 0); !errors.Is(err, ErrTargetAboveLimit) {
		t.Fatalf("expected miner to reject target above limit, got %v", err)
	}
}

func TestHeaderSerializationLength(t *testing.T) {
	header := Header{Version: 2, Timestamp: 3, Bits: 4, Nonce: 5}
	serialized := header.Serialize()
	if len(serialized) != HeaderSize {
		t.Fatalf("serialized header length = %d", len(serialized))
	}
}
