# UNITED Genesis Block Procedure

The genesis block is a consensus constant, not an admin setting. It is not yet generated.

## Required outputs

- Exact source commit and build instructions.
- Genesis coinbase transaction bytes.
- Genesis timestamp and compact target (`nBits`).
- Genesis nonce.
- Merkle root.
- Header hash.
- Chain parameters that all nodes compile in.
- A deterministic verifier that reproduces every output.

## Procedure

1. Finalize consensus rules, PoW limit and timestamp policy.
2. Write a deterministic genesis builder with no network dependency.
3. Document every input and the exact byte serialization.
4. Independently reproduce the coinbase transaction, merkle root and header hash.
5. Mine a valid genesis header under the chosen target.
6. Have at least two independent maintainers verify all bytes and hash calculations.
7. Embed the constants in the node source and add regression tests.
8. Publish the verifier and test vectors before any mainnet launch.

Do not include a secret key, founder reward, hidden premine or opaque message that creates an undisclosed allocation.
