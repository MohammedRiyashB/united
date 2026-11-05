# UNITED Network Architecture

## 1. Architecture principles

1. Users validate consensus locally; explorers, APIs, pool operators and hosted wallets are not consensus authorities.
2. Private keys remain in user-controlled wallet storage or a hardware signer.
3. No administrator key may mint coins, freeze the chain, reverse transactions or change balances.
4. Consensus changes require a public specification, reproducible test vectors, extensive review and a coordinated activation policy.
5. Keep the consensus-critical patch set as small as possible and track upstream security fixes.
6. Mainnet and testnet must have distinct genesis blocks, network magic, ports, address encodings and seed infrastructure.

## 2. Logical layers

```text
Wallets / Merchant apps / Developer SDKs
                  |
          RPC / REST read API
                  |
       UNITED full-node daemon
       | validation | mempool |
       | chainstate | wallet  |
                  |
         P2P peer network
       /         |          \
  full nodes   miners     seed nodes
       \         |          /
        globally replicated UTXO chain
```

## 3. Consensus-critical components

- **Chain parameters:** genesis block, proof-of-work limit, target spacing, difficulty retarget algorithm, subsidy schedule, block limits, activation heights, network magic and address prefixes.
- **Block validation:** header PoW, timestamp rules, difficulty transitions, merkle root, coinbase structure, transaction validity, UTXO spends, scripts, block weight and subsidy-plus-fees limit.
- **Mempool:** policy only; miners may choose transactions, but every node independently validates mined blocks.
- **Chainstate:** deterministic UTXO state, undo data, reorg handling and crash-safe persistence.
- **P2P:** peer discovery, handshake, version negotiation, inventory/block relay, transaction relay, bans/limits and eclipse-resistance measures.
- **Wallet:** key derivation, address management, PSBT/signing, fee estimation, backup/restore and transaction broadcasting.

## 4. Application and service components

| Component | Trust boundary | Purpose |
|---|---|---|
| Full node | Consensus authority for its operator | Verifies all blocks and transactions |
| Mining client | Untrusted block-template consumer | Performs SHA-256d work; submits solutions to a node/pool |
| Mining pool | Non-consensus service | Coordinates miners and distributes pool payouts |
| Wallet | Holds user secrets | Builds and signs transactions |
| Indexer | Derived data; must be re-checkable | Address/transaction lookup and analytics |
| Explorer API | Read-only service | Supplies data from an operator's own node/indexer |
| Mobile/desktop UI | Untrusted display layer | User interaction; never decides consensus |
| Monitoring | Operational signal only | Node health, peer count, lag, disk and resource metrics |

## 5. Technology direction

- **Consensus/full node:** C++ Bitcoin Core-derived codebase with a pinned signed upstream tag and a minimal UNITED patch series.
- **Reference economics and auxiliary services:** Go, where it is appropriate and does not duplicate consensus authority.
- **Explorer frontend:** React + TypeScript.
- **Wallets:** desktop Qt or another reviewed native client; mobile React Native only with platform secure-key storage and a mature wallet library.
- **Storage:** inherit reviewed upstream chainstate/storage implementation; avoid introducing an additional consensus database.
- **Observability:** Prometheus and Grafana, with no private keys or wallet secrets in telemetry.
- **Deployment:** reproducible Linux builds, containers for non-consensus services, systemd for full nodes, signed binaries and checksums.

## 6. Deployment topology

Before mainnet, provision independent operators and regions for seed nodes, archival nodes, mining nodes and monitoring. At least two independent providers and multiple administrative domains should be represented. Do not make all bootstrap peers, mining or explorer availability depend on one founder account or cloud region.

## 7. Explicit non-goals for version 1

- No account-based smart-contract VM.
- No staking or validator set; UNITED v1 is Proof of Work.
- No bridge, wrapped coin, algorithmic stablecoin or custodial exchange.
- No admin mint, blacklist, emergency rollback or founder allocation.
- No promise of instant/final settlement. Confirmation risk must be documented.

A smart-contract platform would require a separate protocol design and security review; it must not be casually added to a PoW UTXO chain.
