# UNITED Genesis Block Procedure

A private development genesis is embedded in the native `unitedregtest` patch. **No public-testnet or mainnet genesis has been generated or approved.**

## Private regtest genesis (development only)

These constants are used only by the isolated `unitedregtest` chain in `core/patches/0001-add-united-regtest.patch`:

- Timestamp: `1700000000` (2023-11-14 22:13:20 UTC)
- Nonce: `1`
- Compact target (`nBits`): `0x207fffff`
- Merkle root: `a9d90d5e7998936472072e79bc476b84d400c5ac22f174e23051c01778c25cc7`
- Header hash: `6d8278642c6e1390286c74bd2697c5251771e9da1b860a5bd3d692b5d0ead151`
- Genesis coinbase output: 50 UNITED to the conventional unspendable genesis output.

The genesis timestamp is deliberately historical so that it cannot be ahead of a node's adjusted clock. Its easy proof-of-work limit and no-retargeting configuration are private-regtest-only and must not be reused on a public testnet or mainnet. The expected hash is checked by native chain-parameter assertions and CI RPC tests.

## Public-testnet and mainnet genesis requirements

For each public network, the genesis block is a consensus constant, not an admin setting. It must be generated only after its complete network consensus parameters are reviewed.

Required outputs:

- Exact source commit, dependencies and reproducible build instructions.
- Genesis coinbase transaction bytes and script.
- Timestamp, compact target (`nBits`) and nonce.
- Merkle root and SHA-256d header hash.
- Chain parameters that every node compiles in.
- A deterministic verifier that reproduces every output independently.

Procedure:

1. Finalize that network's consensus rules, PoW limit and timestamp policy.
2. Write a deterministic genesis builder with no network dependency.
3. Document every input and exact byte serialization.
4. Independently reproduce the coinbase transaction, Merkle root and header hash.
5. Mine a valid genesis header under the chosen target.
6. Have at least two independent maintainers verify the bytes and hash calculations.
7. Embed the constants in the native node and add regression tests.
8. Publish the verifier and test vectors before the network is announced.

Do not include a secret key, founder reward, hidden premine or opaque message that creates an undisclosed allocation.
