# UNITED Hybrid P2P Design

## Goal

Allow browser-based UNITED applications to exchange peer data without requiring the project founder to rent a VPS. Preserve the existing native full-node network and consensus implementation.

## Critical distinction

P2P is a communication topology, not a source of compute. A peer must run on a powered device with an active network connection to do work. WebRTC does not make a closed browser tab run 24/7, does not create storage, and does not guarantee an inbound connection through carrier-grade NAT. A phone browser is an opportunistic peer, not dependable blockchain infrastructure.

## Layers

1. **Consensus layer — unchanged:** Bitcoin Core-derived UNITED native full nodes validate proof of work, blocks, transactions and UTXO state.
2. **Native peer layer — unchanged:** native nodes continue using the existing UNITED TCP P2P protocol and public-testnet parameters.
3. **Browser transport — experimental:** WebRTC DataChannels carry bounded, versioned application messages between browser peers.
4. **Signalling — adapter-based:** peers exchange SDP and ICE candidates through a rendezvous service. A signalling service only helps peers find/connect; it is not a consensus authority. It still needs to be available when a new connection is negotiated.
5. **Discovery — future work:** a DHT or replicated peer directory may reduce reliance on a single rendezvous endpoint. Browser DHT participation itself still needs bootstrap peers and reachable peers.
6. **Persistence — limited:** browser IndexedDB may cache UI data or peer metadata. It must not be treated as authoritative chainstate or wallet-key backup.

## What this implementation does

`web/p2p/peer.js` provides an experimental WebRTC DataChannel wrapper with:
- injected signalling adapter;
- peer identity checks against the expected remote peer;
- a small allowlist of message types;
- message-size limit;
- malformed-message rejection;
- explicit close/unsubscribe lifecycle.

It deliberately does not include a public signalling server, STUN/TURN credentials, DHT, mining, wallet signing, or native-node bridge.

## Next engineering milestones

- Define and review a canonical browser message schema and peer identity/authentication model.
- Add a signalling adapter backed by an existing free-tier service only after its quotas, retention, abuse controls and availability are verified. Firebase Hosting alone is static hosting and cannot relay WebRTC signalling.
- Add ICE candidate forwarding, session expiry, replay protection, per-peer quotas and authenticated signalling.
- Build a native bridge that forwards only explicitly permitted data between WebRTC sessions and a local UNITED node; never expose node RPC to the public internet.
- Validate all received blocks and transactions through the native node.
- Test two browsers on separate networks, including a restrictive NAT/mobile network.
- Only then consider browser peers part of a public testnet user experience.

## No-cost / availability statement

This design requires no VPS purchase by the repository owner. It does not promise a 24/7 network for free: browser peers are online only while their devices and tabs are active, and signalling/STUN/TURN providers have quotas, availability limits and possible paid tiers. Reliable 24/7 block production still requires continuously running native nodes operated by participants.

## Security rules

- Never put RPC credentials, seed phrases or private keys in signalling messages or browser storage.
- Never trust browser-reported balances, blocks, transaction validity or peer counts.
- Do not expose RPC port 29447 to the public internet.
- Bound message sizes, rates, concurrent peers and session lifetimes.
- Treat all peer payloads and signalling data as hostile input.
- Do not advertise this prototype as production-ready or as a live public network.
