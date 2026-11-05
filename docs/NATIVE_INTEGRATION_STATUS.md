# UNITED native Bitcoin Core integration status

**Branch:** `integration/bitcoin-core-32.1-native`  
**Upstream pin:** Bitcoin Core `v32.1`  
**Status:** native private-regtest patch applies and compiles; genesis smoke test exposed incorrect locally calculated constants. Constants have been recalculated from Bitcoin transaction/block serialization; native RPC confirmation is pending.

## Milestones

| Milestone | Status | Evidence / exit criteria |
|---|---|---|
| Pin upstream tag and commit | Recorded | `core/upstream.lock.toml` |
| Create isolated implementation branch | Complete | Git branch name |
| Deterministic upstream bootstrap | Added | Script verifies tag object, commit and signed tag |
| Independently trust maintainer key | Pending | Fingerprint verified from trusted project source |
| Build unmodified upstream v32.1 | Pending | Clean build log and test results |
| Add UNITED private-regtest C++ patch | Implemented, CI pending | `core/patches/0001-add-united-regtest.patch` |
| Implement UNITED subsidy and money range | Not started | Native unit tests at every halving boundary |
| Define regtest/testnet/mainnet parameters | Not started | Collision-checked network identities |
| Private regtest genesis | Recalculated; native RPC verification pending | Expected block hash `2739e631581bbb86a9dfe9827c2ba84ff1ca53a96e0fbaa809784b351540c44a`; merkle root `a9d90d5e7998936472072e79bc476b84d400c5ac22f174e23051c01778c25cc7` |
| Run upstream and UNITED functional/fuzz/sanitizer tests | Not started | CI artifacts and review |
| Independent consensus/security review | Not started | Published findings and remediation |

## Automated build validation

A GitHub Actions workflow clones the pinned upstream tag, checks the exact tag object and commit, applies the UNITED C++ patch, compiles the daemon/CLI, starts `unitedregtest`, and checks its genesis hash over RPC. A passing run is required before claiming a successful native build.

## Immediate next command

```bash
bash scripts/bootstrap-bitcoin-core.sh
```

The default destination is local workspace `.work/bitcoin-core-v32.1`. If tag verification fails because the signing key is absent, stop and independently verify/import the official maintainer key; do not disable verification.

After checkout, build the **unmodified upstream** first using the build instructions for the pinned release. Keep upstream build success separate from UNITED fork success.

## Non-claims

The branch contains a native private-regtest implementation, but it is not yet a verified successful build until CI passes. It is not a public testnet or mainnet and does not authorize accepting funds or launching a mainnet.
