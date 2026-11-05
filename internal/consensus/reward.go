package consensus

// SubsidyUnits returns the block subsidy, in the smallest UNITED unit, at
// height. The subsidy is integer-divided by two at each halving boundary,
// matching the proposed Bitcoin-style schedule. Negative heights return 0.
func SubsidyUnits(height int64) int64 {
	if height < 0 {
		return 0
	}
	era := height / HalvingInterval
	if era >= 63 {
		return 0
	}
	return InitialSubsidy >> uint(era)
}

// ScheduledIssuanceUnits computes all block subsidies across all eras,
// assuming every height is mined and every coinbase claims the full subsidy.
// It excludes transaction fees. Integer rounding means the result is slightly
// below the nominal 21,000,000 UNITED supply cap.
func ScheduledIssuanceUnits() int64 {
	var total int64
	for era := int64(0); ; era++ {
		reward := InitialSubsidy >> uint(era)
		if reward == 0 {
			return total
		}
		total += reward * HalvingInterval
	}
}

// MoneyRange reports whether a value is non-negative and within UNITED's
// nominal maximum money range. Production consensus code must also use
// checked arithmetic before adding input/output values.
func MoneyRange(value int64) bool {
	return value >= 0 && value <= MaxMoneyUnits
}
