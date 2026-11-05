package consensus

import "testing"

func TestMainnetDraftValidates(t *testing.T) {
	if err := MainnetDraft().Validate(); err != nil {
		t.Fatalf("draft parameters should validate: %v", err)
	}
}

func TestSubsidyHalvingBoundaries(t *testing.T) {
	cases := []struct {
		height int64
		want   int64
	}{
		{0, 5_000_000_000},
		{209_999, 5_000_000_000},
		{210_000, 2_500_000_000},
		{419_999, 2_500_000_000},
		{420_000, 1_250_000_000},
		{6_720_000, 1},
		{6_930_000, 0},
		{-1, 0},
	}
	for _, tc := range cases {
		if got := SubsidyUnits(tc.height); got != tc.want {
			t.Errorf("SubsidyUnits(%d) = %d; want %d", tc.height, got, tc.want)
		}
	}
}

func TestScheduledIssuanceAndNominalCap(t *testing.T) {
	const want int64 = 2_099_999_997_690_000 // 20,999,999.9769 UNITED
	got := ScheduledIssuanceUnits()
	if got != want {
		t.Fatalf("scheduled issuance = %d; want %d", got, want)
	}
	if got > MaxMoneyUnits {
		t.Fatalf("scheduled issuance exceeds nominal maximum")
	}
}

func TestMoneyRange(t *testing.T) {
	cases := []struct {
		value int64
		valid bool
	}{
		{-1, false},
		{0, true},
		{1, true},
		{MaxMoneyUnits, true},
		{MaxMoneyUnits + 1, false},
	}
	for _, tc := range cases {
		if got := MoneyRange(tc.value); got != tc.valid {
			t.Errorf("MoneyRange(%d) = %v; want %v", tc.value, got, tc.valid)
		}
	}
}

func TestDraftRejectsPremine(t *testing.T) {
	p := MainnetDraft()
	p.PremineUnits = 1
	if err := p.Validate(); err == nil {
		t.Fatal("expected a premine to be rejected")
	}
}
