// united-powdemo is a local regtest proof-of-work demonstration, not a node.
package main

import (
	"fmt"
	"os"

	"github.com/MohammedRiyashB/united/internal/pow"
)

func main() {
	const regtestBits = uint32(0x207fffff)
	limit, err := pow.CompactToTarget(regtestBits)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	header := pow.Header{Version: 1, Timestamp: 1_800_000_000, Bits: regtestBits}
	mined, err := pow.Mine(header, limit, 0)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Println("UNITED SHA-256d regtest PoW demonstration")
	fmt.Printf("nonce: %d\n", mined.Nonce)
	fmt.Printf("block header hash: %s\n", pow.DisplayHash(mined.Hash()))
	fmt.Println("status: local proof-of-work demo only; not connected to a blockchain network")
}
