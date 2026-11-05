# UNITED native Bitcoin Core integration status

**Branch:** `integration/bitcoin-core-32.1-native`  
**Upstream pin:** Bitcoin Core `v32.1`  
**Status:** bootstrap and integration scaffolding only; not a functioning UNITED fork.

## Milestones

| Milestone | Status | Evidence / exit criteria |
|---|---|---|
| Pin upstream tag and commit | Recorded | `core/upstream.lock.toml` |
| Create isolated implementation branch | Complete | Git branch name |
| Deterministic upstream bootstrap | Added, not executed here | Script verifies tag object, commit and signed tag |
| Independently trust maintainer key | Pending | Fingerprint verified from trusted project source |
| Build unmodified upstream v32.1 | Pending | Clean build log and test results |
| Add UNITED consensus patch series | Not started | Reviewed native C++ patches |
| Implement UNITED subsidy and money range | Not started | Native unit tests at every halving boundary |
| Define regtest/testnet/mainnet parameters | Not started | Collision-checked network identities |
| Generate and verify genesis blocks | Not started | Deterministic script plus independent hash verification |
| Run upstream and UNITED functional/fuzz/sanitizer tests | Not started | CI artifacts and review |
| Independent consensus/security review | Not started | Published findings and remediation |

## Immediate next command

```bash
bash scripts/bootstrap-bitcoin-core.sh
```

The default destination is local workspace `.work/bitcoin-core-v32.1`. If tag verification fails because the signing key is absent, stop and independently verify/import the official maintainer key; do not disable verification.

After checkout, build the **unmodified upstream** first using the build instructions for the pinned release. Keep upstream build success separate from UNITED fork success.

## Non-claims

This branch does not yet contain a UNITED full node, network, mining implementation, wallet, genesis block, binaries, public testnet, or audit. It does not authorize accepting funds or launching a mainnet.
