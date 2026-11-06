# Firebase security and data model

This project uses Firebase Authentication for identity, Cloud Firestore for account metadata/settings, and Realtime Database for authenticated live network/presence data.

## Access model

- All Firestore user documents are private to the matching authenticated UID.
- Firestore collection listing is denied for user-owned collections. Read a known document path for the signed-in UID.
- User profile creation is limited to `displayName`, `createdAt`, and `updatedAt`. Profile updates may change only `displayName` and `updatedAt`.
- User settings are limited to `theme`, `language`, `notificationsEnabled`, and `updatedAt`.
- `networkConfig` is readable only by authenticated users and is client read-only.
- Realtime Database `network` and `presence` are readable only by authenticated users. A user may write only their own `presence/{uid}` node, and only the boolean `online` field.
- All unmatched paths deny access. Deletes are denied for Firestore account documents.

## Client SDK behavior

The web app creates/updates its own Firestore profile after authentication and sets its own RTDB presence. An RTDB on-disconnect handler changes `online` to false. No client-provided timestamp is treated as authoritative.

## Important trust boundary

Firebase is not the blockchain ledger. Never store seed phrases, private keys, signing secrets, RPC credentials, or authoritative balances/UTXO state in Firestore or Realtime Database. Blockchain consensus, transaction validation, balances, and finality must come from UNITED nodes/indexers. Any privileged write must be performed by a trusted backend using Firebase Admin SDK after server-side validation; Admin SDK access bypasses these client rules and must be protected with least-privilege IAM and secret management.

## Deploy

Ensure Cloud Firestore and Realtime Database are created in Firebase project `unitedcryptonetwork`, then from the repository root:

```sh
firebase use unitedcryptonetwork
firebase deploy --only firestore:rules,database
```

Run the Firebase Emulator Suite and automated allow/deny tests before production rollout. These rules are intentionally restrictive; add new collections/paths only with an explicit schema and tests.
