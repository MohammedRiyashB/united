#!/usr/bin/env bash
set -euo pipefail

gofmt -w ./cmd ./internal
go vet ./...
go test -race -count=1 ./...
go build ./cmd/united-params
