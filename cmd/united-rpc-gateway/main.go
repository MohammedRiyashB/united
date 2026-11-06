package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

const expectedChain = "unitedtestnet"

type config struct {
	addr          string
	rpcURL        string
	rpcUser       string
	rpcPass       string
	allowedOrigin string
}

type rpcRequest struct {
	JSONRPC string `json:"jsonrpc"`
	ID      string `json:"id"`
	Method  string `json:"method"`
	Params  []any  `json:"params"`
}

type rpcResponse struct {
	Result json.RawMessage `json:"result"`
	Error  *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

type blockchainInfo struct {
	Chain                string  `json:"chain"`
	Blocks               int64   `json:"blocks"`
	Headers              int64   `json:"headers"`
	BestBlockHash        string  `json:"bestblockhash"`
	Difficulty           float64 `json:"difficulty"`
	VerificationProgress float64 `json:"verificationprogress"`
	InitialBlockDownload bool    `json:"initialblockdownload"`
}

func main() {
	cfg := config{
		addr:          env("PORT", "10000"),
		rpcURL:        strings.TrimSpace(os.Getenv("UNITED_RPC_URL")),
		rpcUser:       os.Getenv("UNITED_RPC_USER"),
		rpcPass:       os.Getenv("UNITED_RPC_PASSWORD"),
		allowedOrigin: strings.TrimSpace(os.Getenv("CORS_ALLOWED_ORIGIN")),
	}
	if cfg.rpcURL != "" {
		u, err := url.Parse(cfg.rpcURL)
		if err != nil || u.Host == "" || (u.Scheme != "https" && !(u.Scheme == "http" && (u.Hostname() == "127.0.0.1" || u.Hostname() == "localhost"))) {
			log.Fatal("UNITED_RPC_URL must use HTTPS; plain HTTP is allowed only for localhost")
		}
		if cfg.rpcUser == "" || cfg.rpcPass == "" {
			log.Fatal("UNITED_RPC_USER and UNITED_RPC_PASSWORD are required when UNITED_RPC_URL is set")
		}
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{"ok": true, "service": "united-rpc-gateway"})
	})
	mux.HandleFunc("GET /readyz", func(w http.ResponseWriter, r *http.Request) {
		if cfg.rpcURL == "" {
			writeJSON(w, http.StatusServiceUnavailable, map[string]any{"ready": false, "reason": "node RPC is not configured"})
			return
		}
		var info blockchainInfo
		if err := callRPC(r.Context(), cfg, "getblockchaininfo", &info); err != nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]any{"ready": false, "reason": "node RPC unavailable"})
			return
		}
		if info.Chain != expectedChain {
			writeJSON(w, http.StatusServiceUnavailable, map[string]any{"ready": false, "reason": "connected node is not UNITED public testnet"})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"ready": true, "chain": info.Chain, "height": info.Blocks})
	})
	mux.HandleFunc("GET /v1/network", func(w http.ResponseWriter, r *http.Request) {
		if cfg.rpcURL == "" {
			writeJSON(w, http.StatusServiceUnavailable, map[string]any{"error": "node RPC is not configured yet"})
			return
		}
		var info blockchainInfo
		if err := callRPC(r.Context(), cfg, "getblockchaininfo", &info); err != nil {
			log.Printf("node RPC request failed: %v", err)
			writeJSON(w, http.StatusBadGateway, map[string]any{"error": "node RPC unavailable"})
			return
		}
		if info.Chain != expectedChain {
			writeJSON(w, http.StatusBadGateway, map[string]any{"error": "configured node is not UNITED public testnet"})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{
			"chain": info.Chain, "network": "testnet", "best_height": info.Blocks,
			"headers": info.Headers, "best_block_hash": info.BestBlockHash,
			"difficulty": info.Difficulty, "verification_progress": info.VerificationProgress,
			"initial_block_download": info.InitialBlockDownload,
			"synced":                 !info.InitialBlockDownload && info.Blocks == info.Headers,
		})
	})

	server := &http.Server{Addr: ":" + cfg.addr, Handler: cors(cfg.allowedOrigin, mux), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 15 * time.Second, IdleTimeout: 60 * time.Second}
	log.Printf("UNITED read-only RPC gateway listening on :%s", cfg.addr)
	log.Fatal(server.ListenAndServe())
}

func callRPC(parent context.Context, cfg config, method string, out any) error {
	ctx, cancel := context.WithTimeout(parent, 8*time.Second)
	defer cancel()
	payload, _ := json.Marshal(rpcRequest{JSONRPC: "1.0", ID: "united-gateway", Method: method, Params: []any{}})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, cfg.rpcURL, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth(cfg.rpcUser, cfg.rpcPass)
	resp, err := (&http.Client{Timeout: 9 * time.Second}).Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("RPC returned HTTP %d", resp.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return err
	}
	var envelope rpcResponse
	if err := json.Unmarshal(body, &envelope); err != nil {
		return err
	}
	if envelope.Error != nil {
		return errors.New(envelope.Error.Message)
	}
	if len(envelope.Result) == 0 || string(envelope.Result) == "null" {
		return errors.New("empty RPC result")
	}
	return json.Unmarshal(envelope.Result, out)
}

func cors(origin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestOrigin := r.Header.Get("Origin")
		if origin != "" && requestOrigin == origin {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Add("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if requestOrigin != "" && origin != "" && requestOrigin != origin {
			writeJSON(w, http.StatusForbidden, map[string]string{"error": "origin not allowed"})
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func env(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}
