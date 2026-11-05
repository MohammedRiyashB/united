# UNITED Security Model

## Threats to address

- Consensus divergence from arithmetic, serialization or parameter mismatches.
- 51% hash-power attacks, selfish mining and deep reorganizations.
- Eclipse/Sybil attacks, malicious peers and invalid-message resource exhaustion.
- Wallet seed theft, insecure backups, malware and supply-chain compromise.
- Mining pool compromise or payout manipulation.
- Explorer/indexer/API data poisoning or stale chain tips.
- Release signing-key theft and dependency compromise.
- Cloud/provider outage, disk failure, data corruption and insider abuse.

## Mandatory controls

- Inherit mature cryptographic and validation primitives; no custom cryptography.
- Pin and verify upstream signatures and hashes; record the full source commit.
- Reproducible builds and signed releases with offline-protected release keys.
- Fuzzing and sanitizers for parsers, consensus logic and network messages.
- Differential consensus tests against independent reference vectors.
- Least-privilege node users, firewall RPC, bind RPC to localhost/private interfaces, strong RPC credentials and no public wallet RPC.
- Wallet keys encrypted at rest; seed phrase shown only when explicitly requested; no seed/private key in logs, analytics, crash dumps or support tickets.
- Hardware-backed key storage where available; independent wallet security review.
- Independent operators, diverse hosting and monitoring for chain stalls, reorg depth, peer diversity and hash rate.
- Incident response, coordinated disclosure and a security contact before public launch.

## Vulnerability reporting

Do not publish an exploitable vulnerability in a public issue. Until a dedicated private security channel is established, do not place sensitive exploit details in this repository. Establish a monitored security email and a response SLA before testnet users hold meaningful value.

## Audit status

No independent audit has been performed. The presence of this document is not an audit or security certification.
