# UNITED native patch series

**Patch 0001 is implemented:** `0001-add-united-regtest.patch`.

It adds a private development chain named `unitedregtest` to the pinned Bitcoin Core v32.1 source. The patch includes a unique genesis block and isolated network identifiers, while retaining native Bitcoin Core consensus validation and SHA-256d proof-of-work.

This is not the public UNITED testnet or mainnet. Its easy PoW target and no-retargeting setting are deliberately limited to private regression testing.

Every subsequent patch must include native C++ tests, rationale, exact upstream file references and a consensus-impact assessment. Do not introduce production network settings until they have been reviewed and independently tested.
