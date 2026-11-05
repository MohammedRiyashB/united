# Native Bitcoin Core integration workspace

## Current state

- Upstream: Bitcoin Core `v32.1`
- Tag object and commit: locked in [upstream.lock.toml](upstream.lock.toml)
- Bootstrap: [scripts/bootstrap-bitcoin-core.sh](../scripts/bootstrap-bitcoin-core.sh)
- Local source destination: `.work/bitcoin-core-v32.1` (local working copy; do not commit generated build output)
- UNITED patch series: **not yet implemented**
- Native UNITED daemon: **not yet built**
- Genesis and network parameters: **not yet selected**

The bootstrap script clones the upstream repository, checks the exact annotated tag object and commit against the lock file, and runs `git verify-tag`. Signature verification requires the operator to independently obtain and trust the correct maintainer key. A valid signature from an untrusted key is not sufficient.

## Why upstream source is not copied into this repository yet

Bitcoin Core is a substantial independently maintained codebase. The safest first step is a deterministic source checkout, followed by a small reviewed patch series. Avoid an opaque copy, a blind mass-rebrand, or relabelling upstream binaries as UNITED. Preserve all upstream licensing and copyright notices.

## Integration sequence

1. Verify the maintainer signing-key fingerprint out of band.
2. Run the bootstrap script on a machine with Git and the required trusted keyring.
3. Build and test unmodified upstream v32.1; save logs and toolchain/dependency metadata.
4. Add a narrow patch series for UNITED chain parameters and monetary policy.
5. Add deterministic genesis generation and separate regtest/testnet/mainnet identities.
6. Add consensus-specific functional tests and compare expected results against independent implementations.
7. Review the complete diff against the pinned upstream commit.

No network identifiers, genesis values, seeds, or launch settings may be guessed to make the build appear complete.
