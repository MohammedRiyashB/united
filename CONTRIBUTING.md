# Contributing to UNITED

Thanks for considering a contribution. The protocol is not frozen and the network is not live.

## Before opening a pull request

- Search existing issues and proposals.
- Keep changes narrow and explain the user/security impact.
- Add tests for behavior changes and negative cases.
- Run `gofmt`, `go vet ./...` and `go test -race ./...` for Go changes.
- Never commit credentials, private keys, wallet seeds, real user data or production node dumps.

## Consensus changes

Consensus modifications require a separate written proposal including rationale, exact rules, compatibility, threat model, test vectors, activation method, downgrade/reorg implications and independent review. Do not bundle consensus changes with style refactors or UI updates.

## Pull request checklist

- [ ] Scope and rationale explained.
- [ ] Tests added/updated.
- [ ] Security and compatibility impact described.
- [ ] Documentation updated.
- [ ] No secrets or private user data included.
