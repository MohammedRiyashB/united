// Package pow provides a development-only SHA-256d block-header proof-of-work
// prototype. It is not wired into a full node and is not production consensus.
package pow

import (
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"math/big"
)

const HeaderSize = 80

var (
	ErrInvalidCompactTarget = errors.New("invalid compact proof-of-work target")
	ErrTargetAboveLimit     = errors.New("target exceeds proof-of-work limit")
	ErrNonceExhausted       = errors.New("nonce space exhausted")
)

// Header is the serialized 80-byte Bitcoin-style block header. PrevBlock and
// MerkleRoot contain the 32-byte wire-order hashes, not display-order hex.
type Header struct {
	Version    int32
	PrevBlock  [32]byte
	MerkleRoot [32]byte
	Timestamp  uint32
	Bits       uint32
	Nonce      uint32
}

func (h Header) Serialize() [HeaderSize]byte {
	var out [HeaderSize]byte
	binary.LittleEndian.PutUint32(out[0:4], uint32(h.Version))
	copy(out[4:36], h.PrevBlock[:])
	copy(out[36:68], h.MerkleRoot[:])
	binary.LittleEndian.PutUint32(out[68:72], h.Timestamp)
	binary.LittleEndian.PutUint32(out[72:76], h.Bits)
	binary.LittleEndian.PutUint32(out[76:80], h.Nonce)
	return out
}

// Hash returns the raw wire-order double-SHA-256 header hash.
func (h Header) Hash() [32]byte {
	serialized := h.Serialize()
	first := sha256.Sum256(serialized[:])
	return sha256.Sum256(first[:])
}

// DisplayHash converts a raw wire-order hash to conventional reversed hex.
func DisplayHash(hash [32]byte) string {
	var reversed [32]byte
	for i := range hash {
		reversed[31-i] = hash[i]
	}
	return hex.EncodeToString(reversed[:])
}

// CompactToTarget decodes Bitcoin's compact target representation and rejects
// negative, zero and overflowing encodings.
func CompactToTarget(bits uint32) (*big.Int, error) {
	size := uint(bits >> 24)
	word := bits & 0x007fffff
	negative := word != 0 && bits&0x00800000 != 0
	overflow := word != 0 && (size > 34 || (word > 0xff && size > 33) || (word > 0xffff && size > 32))
	if negative || overflow || word == 0 {
		return nil, ErrInvalidCompactTarget
	}
	target := new(big.Int).SetUint64(uint64(word))
	if size <= 3 {
		target.Rsh(target, 8*(3-size))
	} else {
		target.Lsh(target, 8*(size-3))
	}
	if target.Sign() <= 0 {
		return nil, ErrInvalidCompactTarget
	}
	return target, nil
}

// HashToInteger interprets a wire-order uint256 as a little-endian integer.
func HashToInteger(hash [32]byte) *big.Int {
	var reversed [32]byte
	for i := range hash {
		reversed[31-i] = hash[i]
	}
	return new(big.Int).SetBytes(reversed[:])
}

// CheckProof validates target encoding, the configured PoW limit and the hash.
func CheckProof(header Header, powLimit *big.Int) error {
	target, err := CompactToTarget(header.Bits)
	if err != nil {
		return err
	}
	if powLimit == nil || powLimit.Sign() <= 0 || target.Cmp(powLimit) > 0 {
		return ErrTargetAboveLimit
	}
	if HashToInteger(header.Hash()).Cmp(target) > 0 {
		return errors.New("header hash does not satisfy proof-of-work target")
	}
	return nil
}

// Mine searches the nonce range [startNonce, MaxUint32]. It is intended only
// for regtest demonstrations and tests, never for production mining.
func Mine(header Header, powLimit *big.Int, startNonce uint32) (Header, error) {
	target, err := CompactToTarget(header.Bits)
	if err != nil {
		return Header{}, err
	}
	if powLimit == nil || powLimit.Sign() <= 0 || target.Cmp(powLimit) > 0 {
		return Header{}, ErrTargetAboveLimit
	}
	for nonce := startNonce; ; nonce++ {
		header.Nonce = nonce
		if HashToInteger(header.Hash()).Cmp(target) <= 0 {
			return header, nil
		}
		if nonce == ^uint32(0) {
			return Header{}, ErrNonceExhausted
		}
	}
}
