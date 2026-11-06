# UNITED native Bitcoin Core integration status

**Active test branch:** `integration/united-regtest-functional-tests`  
**Upstream:** Bitcoin Core `v32.1` pinned to the reviewed commit in `core/upstream.lock.toml`.

## Verified milestone: native private regtest build

GitHub Actions run `42119554863` completed successfully. Its job passed all ten steps:
- clone pinned upstream;
- verify exact tag object and commit;
- apply UNITED C++ patch;
- configure CMake;
- compile native daemon and CLI;
- start `unitedregtest`;
- query and verify genesis block hash over RPC.

Expected private-regtest genesis hash:
`2739e631581bbb86a9dfe9827c2ba84ff1ca53a96e0fbaa809784b351540c44a`

Expected genesis Merkle root:
`a9d90d5e7998936472072e79bc476b84d400c5ac22f174e23051c01778c25cc7`

This proves a working **private development regtest** only. It does not prove a public network, production consensus readiness, or mainnet launch.

## Next validation added in this branch

The CI workflow is expanded to build wallet support and exercise two independent UNITED regtest nodes:
1. Start two nodes with separate data directories and RPC/P2P ports.
2. Verify both nodes report the expected genesis block.
3. Create separate wallets and addresses.
4. Mine 101 blocks and check coinbase maturity and miner balance.
5. Establish a TCP P2P connection between the nodes.
6. Send a wallet transaction from node 1 to node 2.
7. Mine a confirmation block and verify node 2 syncs and its wallet receives the funds.

These are automated test intentions until the new workflow run passes. Do not mark mining, wallet, transaction or P2P validation complete before seeing that result.

## Remaining production gates

- Add native unit and functional tests for monetary subsidy, maximum money, fee and overflow boundaries, difficulty retargeting, timestamp rules, script validation and reorg behavior.
- Define separate public testnet and mainnet chain parameters with collision-checked network magic, ports, address prefixes, HRPs, genesis and seed infrastructure.
- Freeze activation schedules and consensus parameters only after documented review and independent test vectors.
- Build reproducible release binaries and secure signing/release procedures.
- Operate a public testnet with multiple independent operators and a sustained soak period.
- Commission independent consensus, cryptography, networking, wallet and operational security audits; publish findings and remediate them.

## Mainnet safety

The current private regtest deliberately uses an easy PoW target, minimum-difficulty allowance and disabled retargeting. These settings must never be copied to mainnet. The draft monetary schedule targets a nominal 21,000,000 UNITED cap (integer subsidy schedule totals 20,999,999.97690000 UNITED). Mainnet genesis and production PoW limit are not yet defined.

No mainnet launch, public token sale, custody of user funds, or exchange listing is authorized by this engineering branch.

## RPC startup failure investigation (2026-11-06)

The two-node workflow run `42120978922` successfully cloned the pinned source, applied the patch, configured CMake and compiled the wallet-enabled daemon/CLI. Both daemon invocations printed `Bitcoin Core starting`, but the script's RPC readiness loop timed out after 40 seconds. The previous workflow daemonized immediately and suppressed all bitcoin-cli errors; it did not preserve or print either node's `debug.log`, so that run does **not** reveal the underlying startup failure.

The test harness is corrected to use `-daemonwait=1` so daemon initialization failures are returned synchronously, enable debug logging, report the last bitcoin-cli error, and dump each node's debug log if RPC is still unavailable. This is a diagnostics fix; the underlying RPC cause and the functional tests remain unverified until the next CI run.


## Follow-up startup diagnostics (2026-11-06)

GitHub Actions job `127578648991` (run `114141748682`) compiled the wallet-enabled node and then failed in the node-start step. Its console shows two `Bitcoin Core starting` messages followed by `Error during initialization - check debug.log for details`. The log does **not** contain the underlying cause: with Bash `set -e`, the failing `-daemonwait` command terminated the step before the existing `dump_diagnostics` function or RPC wait logic could execute. The job's temporary datadirs were subsequently cleaned up, so the missing debug log cannot be recovered from that run.

The workflow now wraps each daemon startup in an explicit conditional, captures that node's startup output, and on failure prints the captured output plus the node's `debug.log` tail and both-node process/log diagnostics before returning the original exit status. The actual consensus/node startup cause is still not proven; it will be visible in the next run's failure output.

## Two-node P2P port collision fix (2026-11-06)

GitHub Actions run `42124020306`, job `127583425215`, compiled successfully and started node 1. Node 2 failed during initialization. Its `debug.log` shows the following sequence:

- Node 1's P2P listener was configured for port `29444`.
- Bitcoin Core's automatic PCP/NAT-PMP port mapping opened a local helper socket at `127.0.0.1:29445` (the next port).
- Node 2 was configured to use P2P port `29445`, so its listener collided with that helper socket. The log reports `Unable to bind to 0.0.0.0:29445` and then `Failed to listen on any port`.

The CI harness now disables automatic NAT-PMP mapping (`-natpmp=0`), external address discovery (`-discover=0`) and onion listening (`-listenonion=0`) for both isolated test nodes, and explicitly binds each node to its distinct loopback P2P endpoint (`127.0.0.1:29444` and `127.0.0.1:29445`). This removes an unnecessary router-mapping feature from the local two-node test while preserving the direct TCP P2P test. The next CI run must verify startup and the remaining mining/wallet/transaction/P2P assertions.
