package main

import (
	"fmt"
	"os"
	"strconv"

	"github.com/MohammedRiyashB/united/internal/consensus"
)

func main() {
	params := consensus.MainnetDraft()
	if err := params.Validate(); err != nil {
		fmt.Fprintln(os.Stderr, "invalid UNITED draft:", err)
		os.Exit(1)
	}

	if len(os.Args) == 3 && os.Args[1] == "subsidy" {
		height, err := strconv.ParseInt(os.Args[2], 10, 64)
		if err != nil || height < 0 {
			fmt.Fprintln(os.Stderr, "usage: united-params subsidy <non-negative-block-height>")
			os.Exit(2)
		}
		units := consensus.SubsidyUnits(height)
		fmt.Printf("height: %d\nsubsidy: %d smallest units\nsubsidy: %.8f UNITED\n", height, units, float64(units)/float64(consensus.UnitsPerCoin))
		return
	}

	issued := consensus.ScheduledIssuanceUnits()
	fmt.Println("UNITED monetary policy reference")
	fmt.Printf("coin: %s (%s)\n", params.Name, params.Ticker)
	fmt.Printf("algorithm: %s\n", params.Algorithm)
	fmt.Printf("nominal supply cap: %d UNITED\n", consensus.MaxSupplyCoins)
	fmt.Printf("scheduled subsidy issuance: %.8f UNITED\n", float64(issued)/float64(consensus.UnitsPerCoin))
	fmt.Printf("initial reward: %.8f UNITED\n", float64(consensus.InitialSubsidy)/float64(consensus.UnitsPerCoin))
	fmt.Printf("halving interval: %d blocks\n", consensus.HalvingInterval)
	fmt.Printf("target spacing: %d seconds\n", consensus.TargetSpacing)
	fmt.Printf("retarget interval: %d blocks\n", consensus.RetargetInterval)
	fmt.Printf("premine: 0 UNITED\n")
	fmt.Println("status: reference model only; no node, P2P network, wallet, or mainnet exists yet")
}
