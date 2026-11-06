# UNITED Hybrid P2P browser transport (experimental)

This directory contains an experimental browser-side transport layer for UNITED. It does **not** replace the Bitcoin Core-derived native full node, its consensus rules, or its TCP P2P network.

## Design

- Native UNITED full nodes remain the only production consensus participants in this phase.
- Browser peers may exchange bounded application messages over WebRTC DataChannels.
- A signalling adapter is injected by the host application. This keeps the transport independent of a paid signalling vendor and allows a Firebase Realtime Database adapter or another rendezvous service to be added separately.
- STUN/TURN configuration is supplied by the host. STUN helps establish direct paths; TURN is a relay and may incur cost.
- Browser peers are opportunistic: a tab can disconnect, mobile browsers suspend background tabs, and IndexedDB is not a substitute for native chainstate.
- No browser peer is treated as a trusted source. Any block or transaction data must be checked by a native UNITED node before it affects consensus.

## Current status

The module is a transport prototype, not a deployed network. No public signalling endpoint, STUN/TURN service, DHT, public peer directory, or bridge to Bitcoin Core's P2P message stream is included. The repository's existing public-testnet TCP port and consensus implementation remain unchanged.

## Host integration contract

Provide a signalling adapter with:
- `send(message)` to deliver a signal to a specific peer;
- `subscribe(handler)` to receive signals and return an unsubscribe function;
- signal messages containing `to`, `from`, `description` or `candidate`.

The host must authenticate and authorize signalling messages, rate-limit them, expire stale sessions, and avoid exposing wallet secrets. Do not put RPC credentials or private keys in browser code.

## Local tests

Run the repository's Go tests as usual. The browser module has no third-party runtime dependencies and can be syntax-checked with a modern Node.js runtime:

```sh
node --check web/p2p/peer.js
```

A real interoperability test still requires two browsers, a signalling adapter, and a reachable STUN service.
