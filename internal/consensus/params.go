// Package consensus contains UNITED's reviewed design constants and reference
// monetary-policy checks. It is not the consensus implementation used by nodes.
package consensus

import "fmt"

const (
	CoinName               = "United"
	Ticker                 = "UNITED"
	UnitDecimals           = 8
	UnitsPerCoin     int64 = 100_000_000
	MaxSupplyCoins   int64 = 21_000_000
	MaxMoneyUnits    int64 = MaxSupplyCoins * UnitsPerCoin
	InitialSubsidy   int64 = 50 * UnitsPerCoin
	HalvingInterval  int64 = 210_000
	TargetSpacing          = 10 * 60
	TargetTimespan         = 14 * 24 * 60 * 60
	RetargetInterval       = TargetTimespan / TargetSpacing
)

// Params is a reference representation of protocol policy. Network-specific
// values such as magic bytes, ports, address prefixes, genesis data and PoW
// limit intentionally remain unset until collision checks and review finish.
type Params struct {
	Name                  string
	Ticker                string
	Algorithm             string
	Decimals              int
	InitialSubsidyUnits   int64
	HalvingIntervalBlocks int64
	TargetSpacingSeconds  int64
	TargetTimespanSeconds int64
	RetargetInterval      int64
	PremineUnits          int64
	CoinbaseMaturity      int64
}

// MainnetDraft returns the agreed monetary and timing draft, not deployable
// chain parameters. It deliberately does not contain a genesis block or PoW limit.
func MainnetDraft() Params {
	return Params{
		Name:                  CoinName,
		Ticker:                Ticker,
		Algorithm:             "SHA-256d",
		Decimals:              UnitDecimals,
		InitialSubsidyUnits:   InitialSubsidy,
		HalvingIntervalBlocks: HalvingInterval,
		TargetSpacingSeconds:  TargetSpacing,
		TargetTimespanSeconds: TargetTimespan,
		RetargetInterval:      RetargetInterval,
		PremineUnits:          0,
		CoinbaseMaturity:      100,
	}
}

// Validate checks internal consistency of the currently agreed draft values.
func (p Params) Validate() error {
	if p.Name == "" || p.Ticker == "" {
		return fmt.Errorf("coin name and ticker are required")
	}
	if p.Algorithm != "SHA-256d" {
		return fmt.Errorf("unsupported draft PoW algorithm %q", p.Algorithm)
	}
	if p.Decimals != UnitDecimals {
		return fmt.Errorf("UNITED must use %d decimal places", UnitDecimals)
	}
	if p.InitialSubsidyUnits != InitialSubsidy {
		return fmt.Errorf("initial subsidy must be %d smallest units", InitialSubsidy)
	}
	if p.HalvingIntervalBlocks <= 0 || p.TargetSpacingSeconds <= 0 || p.TargetTimespanSeconds <= 0 {
		return fmt.Errorf("halving interval and PoW timing values must be positive")
	}
	if p.TargetTimespanSeconds%p.TargetSpacingSeconds != 0 {
		return fmt.Errorf("target timespan must be divisible by target spacing")
	}
	if p.RetargetInterval != p.TargetTimespanSeconds/p.TargetSpacingSeconds {
		return fmt.Errorf("retarget interval does not match target timespan / spacing")
	}
	if p.PremineUnits != 0 {
		return fmt.Errorf("draft policy forbids a premine")
	}
	if p.CoinbaseMaturity <= 0 {
		return fmt.Errorf("coinbase maturity must be positive")
	}
	return nil
}
