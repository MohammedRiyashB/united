# UNITED patch series

**Status: empty — no native UNITED patches have been applied.**

Patches will be numbered and kept small, for example:

- `0001-chainparams-add-united-regtest.patch`
- `0002-consensus-add-united-subsidy.patch`
- `0003-chainparams-add-united-testnet.patch`

Do not create mainnet parameters until their values and genesis are independently reviewed. Each patch must include corresponding native unit/functional tests, rationale, upstream file references, and an explicit consensus-impact assessment.

The initial implementation should start with a disposable regtest network. Mainnet and public testnet must remain unavailable until separate identities and activation rules are reviewed. Never patch Bitcoin Core's historical Bitcoin mainnet genesis or activation history in place and assume it is suitable for UNITED.
