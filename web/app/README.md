# UNITED web authentication app

This is a static browser frontend using Firebase Authentication. It supports Email/Password, Google, GitHub, and Anonymous sign-in.

## Firebase setup

1. In Firebase Console, open Authentication → Settings → Authorized domains.
2. Add the actual Hosting domain (for example, `unitedcryptonetwork.web.app`) if it is not already listed.
3. Confirm Email/Password, Google, GitHub, and Anonymous providers are enabled.
4. For GitHub sign-in, configure the GitHub OAuth app callback URL shown by Firebase in the GitHub provider settings.
5. Do not loosen Realtime Database rules for this login page; it does not access the database.

## Deploy

The repository root already contains `.firebaserc` and `firebase.json`; the configured Hosting public directory is `web/app`. From a trusted machine with Firebase CLI access, run `firebase deploy --only hosting --project unitedcryptonetwork`. The expected Hosting domain is `https://unitedcryptonetwork.web.app/`.

## Security boundaries

- Firebase Authentication authenticates a user; it does not encrypt or back up blockchain private keys.
- This page deliberately does not generate, collect, or upload wallet private keys.
- Wallet generation and signing must use UNITED's verified chain/address implementation and client-side cryptography.
- The Firebase web configuration contains a client API key, not an admin credential. Never place service-account keys or Admin SDK credentials in browser code.
- This is an authentication frontend, not a live blockchain node, miner, wallet, or transaction explorer.
