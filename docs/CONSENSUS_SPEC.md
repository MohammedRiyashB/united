# UNITED Consensus Specification — Draft 0.1

**Status:** design draft; not a complete or deployable consensus specification.

## 1. Monetary units

- Coin: United
- Ticker: UNITED (working symbol)
- 1 UNITED = 100,000,000 smallest units
- Nominal supply cap: 21,000,000 UNITED
- Initial block subsidy: 5,000,000,000 smallest units (50 UNITED)
- Halving interval: 210,000 blocks
- Premine: zero

For block height `h >= 0`:

```text
halvings = floor(h / 210000)
subsidy_units(h) = floor(5,000,000,000 / 2^halvings)
```

When integer subsidy becomes zero, no further subsidy is created. The total theoretical schedule in smallest units is 2,099,999,997,690,000, or 20,999,999.97690000 UNITED. The nominal cap remains 21,000,000 UNITED. Fees are transfers from users to miners and do not increase supply. Unclaimed coinbase output does not create spendable supply.

## 2. Proposed consensus family

- UTXO transaction model.
- SHA-256d block-header proof of work.
- 600-second target spacing.
- 1,209,600-second target timespan.
- 2,016-block difficulty retarget interval.
- 100-block coinbase maturity (draft).
- No minimum-difficulty exception on mainnet (draft).
- Difficulty adjustment clamp and exact timestamp/median-time rules must be specified and implemented by inheriting or explicitly documenting reviewed upstream behavior.

The exact `powLimit`, compact-target canonicalization rules, retarget arithmetic, timestamp constraints, maximum future time, block version/activation policy and genesis `nBits` are not settled in this draft.

## 3. Required transaction and block rules

The final specification must define, test and freeze:

- transaction serialization and identifiers;
- input/output and script verification semantics;
- witness serialization and activation rules, if inherited;
- coinbase height encoding and maturity;
- maximum money and overflow-safe arithmetic;
- duplicate transaction / UTXO handling;
- block weight and sigops limits;
- merkle tree and witness commitment behavior;
- difficulty transition behavior and reorg selection;
- deployment/activation thresholds and timeouts;
- dust and relay policy separately from consensus.

Do not invent custom signatures, hashes or address schemes. Reuse audited primitives from the selected upstream implementation unless a reviewed specification requires otherwise.

## 4. Genesis block

Genesis time, nonce, compact target, coinbase transaction, merkle root and block hash are intentionally unset. The genesis-generation procedure must be deterministic, produce a human-readable launch commitment without embedding promotional claims, and be independently reproducible from documented source code. Mainnet genesis must never be generated from a private or opaque toolchain.

## 5. Network identifiers

Mainnet, testnet and regtest need unique four-byte message-start values, ports, address prefixes, Bech32 HRPs, seed lists and genesis hashes. The current config leaves these unset. Collision search and test vectors are required before freezing them.

## 6. Consensus change policy

Every consensus change must include:

1. a written protocol proposal;
2. threat and compatibility analysis;
3. reference vectors and negative tests;
4. at least two independent implementations or cross-checks for critical arithmetic where practical;
5. review by independent maintainers;
6. explicit deployment/activation rules;
7. a public release and migration notice.

No direct mainnet parameter change is allowed by editing a config file. Consensus parameters are compiled into and validated by node software.
