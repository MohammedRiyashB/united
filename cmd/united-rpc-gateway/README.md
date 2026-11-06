# UNITED read-only RPC gateway

A narrow HTTP status gateway for an independently operated UNITED public-testnet node. It does **not** implement consensus, mine blocks, store blockchain data, or make the network public by itself.

## Endpoints

- `GET /healthz` — process liveness only; does not imply a node is connected.
- `GET /readyz` — verifies the configured node reports `unitedtestnet`.
- `GET /v1/network` — returns an allowlisted subset of the node's `getblockchaininfo` response.

There is no generic JSON-RPC proxy and no wallet, signing, mining, or write endpoint.

## Render configuration

- Runtime: Go
- Build command: `go build -o app ./cmd/united-rpc-gateway`
- Start command: `./app`
- Root directory: blank
- Health check path: `/healthz`

Environment variables:

- `PORT`: supplied by Render; defaults to `10000` locally.
- `UNITED_RPC_URL`: HTTPS URL to a privately reachable node RPC endpoint. Plain HTTP is accepted only for localhost development.
- `UNITED_RPC_USER`: node RPC username.
- `UNITED_RPC_PASSWORD`: node RPC password.
- `CORS_ALLOWED_ORIGIN`: optional exact browser origin, e.g. `https://unitedcryptonetwork.web.app`.

Do not expose node RPC port `29447` publicly. Never commit RPC credentials or put them in browser/Firebase configuration. Configure connectivity only after a private encrypted route from Render to the node has been designed and verified.

Without RPC settings, `/healthz` returns OK while `/readyz` and `/v1/network` correctly report that the node is not configured.
