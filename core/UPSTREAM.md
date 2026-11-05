# Upstream Core Selection and Fork Policy

## Proposed base

Use Bitcoin Core as the protocol-engineering baseline because UNITED is designed as a SHA-256d UTXO chain. The release list currently identifies Bitcoin Core v32.1 as the latest release and its signed tag as verified. This information must be checked again when the actual fork is made; never trust a tag solely because its name looks correct.

- Repository: https://github.com/bitcoin/bitcoin
- Releases: https://github.com/bitcoin/bitcoin/releases
- Selected baseline for initial evaluation: `v32.1`
- Reported signed tag commit: `f0de87f` (re-verify the full object ID and signer at clone time)

## Required fork procedure

```bash
git clone https://github.com/bitcoin/bitcoin.git bitcoin-core
cd bitcoin-core
git fetch --tags --force
git checkout v32.1
git verify-tag v32.1
git rev-parse v32.1
```

Record the full commit hash, signer fingerprint, release notes, source archive hashes, compiler/toolchain, dependency versions and SBOM. Verify the release signer against independently trusted Bitcoin Core project documentation. If verification fails, stop.

## Patch discipline

- Keep UNITED-specific changes in a small patch series or maintained fork branch.
- Document each changed consensus file and the reason.
- Do not replace cryptographic primitives or script validation casually.
- Do not delete upstream copyright/license notices.
- Rebase security fixes promptly and rerun the entire consensus test suite.
- Maintain a compatibility matrix and explicit upgrade/activation policy.

This repository currently does not include Bitcoin Core source. The Go model here is only a reference sanity check and is not the production consensus engine.
