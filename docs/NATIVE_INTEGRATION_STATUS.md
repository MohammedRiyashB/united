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