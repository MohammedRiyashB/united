# UNITED native patch series

**Patch 0001 is implemented:** `0001-add-united-regtest.patch`.

It adds a private development chain named `unitedregtest` to the pinned Bitcoin Core v32.1 source. The patch includes a unique genesis block and isolated network identifiers, while retaining native Bitcoin Core consensus validation and SHA-256d proof-of-work.

This is not the public UNITED testnet or mainnet. Its easy PoW target and no-retargeting setting are deliberately limited to private regression testing.

Every subsequent patch must include native C++ tests, rationale, exact upstream file references and a consensus-impact assessment. Do not introduce production network settings until they have been reviewed and independently tested.


## Patch 0002 — public testnet candidate

`0002-add-united-public-testnet.patch` adds a distinct `unitedtestnet` chain type on top of patch 0001. It uses candidate message magic `fa b1 d0 02`, P2P/RPC ports `29446/29447`, HRP `tunit`, a distinct SHA-256d genesis, 10-minute spacing, 2,016-block retargeting, the testnet minimum-difficulty exception and BIP94 retarget protection. No DNS seeds or fixed peers are configured.

The patch and parameters require successful native CI and independent review. The presence of the patch does not mean public seed infrastructure, miners, release binaries or a live public testnet exist.
