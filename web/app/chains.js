// UNITED multi-chain mainnet registry and read-only network adapters.
// Private keys stay in the browser vault; this module never uploads signing material.
const RPC_TIMEOUT_MS = 12000;

export const NETWORKS = [
  {
    id: "bitcoin", name: "Bitcoin Mainnet", symbol: "BTC", family: "utxo",
    unit: 100000000, derivationPath: "m/84'/0'/0'/0/0",
    explorer: "https://mempool.space",
    api: "https://mempool.space/api"
  },
  {
    id: "ethereum", name: "Ethereum Mainnet", symbol: "ETH", family: "evm",
    chainId: 1, chainHex: "0x1", unit: 1e18, derivationPath: "m/44'/60'/0'/0/0",
    rpc: "https://ethereum-rpc.publicnode.com", explorer: "https://etherscan.io"
  },
  {
    id: "polygon", name: "Polygon Mainnet", symbol: "POL", family: "evm",
    chainId: 137, chainHex: "0x89", unit: 1e18, derivationPath: "m/44'/60'/0'/0/0",
    rpc: "https://polygon.drpc.org", explorer: "https://polygonscan.com"
  },
  {
    id: "solana", name: "Solana Mainnet", symbol: "SOL", family: "solana",
    unit: 1e9, derivationPath: "m/44'/501'/0'/0'",
    rpc: "https://api.mainnet.solana.com", genesisHash: "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2T",
    explorer: "https://explorer.solana.com"
  },
  {
    id: "bsc", name: "BNB Smart Chain Mainnet", symbol: "BNB", family: "evm",
    chainId: 56, chainHex: "0x38", unit: 1e18, derivationPath: "m/44'/60'/0'/0/0",
    rpc: "https://bsc-dataseed.bnbchain.org", explorer: "https://bscscan.com"
  }
];

const dependencyLoader = Promise.all([
  import("https://esm.sh/@scure/bip39@2.4.0?bundle"),
  import("https://esm.sh/@scure/bip32@2.4.0?bundle"),
  import("https://esm.sh/@scure/btc-signer@2.4.1?bundle"),
  import("https://esm.sh/micro-key-producer@0.10.2/slip10.js?bundle"),
  import("https://esm.sh/@scure/base@2.4.0?bundle")
]);

export function getNetwork(id) {
  const network = NETWORKS.find((item) => item.id === id);
  if (!network) throw new Error("Unsupported UNITED network.");
  return network;
}

export async function deriveMultiChainAccounts(mnemonic, evmAddress) {
  const phrase = String(mnemonic || "").trim().toLowerCase().replace(/\\s+/g, " ");
  const [bip39, bip32, btc, slip10Module, base] = await dependencyLoader;
  if (!bip39.validateMnemonic(phrase)) throw new Error("Invalid BIP-39 recovery phrase.");
  const seed = await bip39.mnemonicToSeedWebcrypto(phrase, "");
  const bitcoinNode = bip32.HDKey.fromMasterSeed(seed).derive("m/84'/0'/0'/0/0");
  const bitcoinPayment = btc.p2wpkh(bitcoinNode.publicKey);
  if (!bitcoinPayment || !bitcoinPayment.address || !bitcoinPayment.address.startsWith("bc1q")) {
    throw new Error("Bitcoin mainnet address derivation failed.");
  }
  const slip10 = slip10Module.default || slip10Module;
  const solanaNode = slip10.fromMasterSeed(seed).derive("m/44'/501'/0'/0'");
  const solanaAddress = base.base58.encode(solanaNode.publicKeyRaw);
  if (!solanaAddress || solanaAddress.length < 32 || solanaAddress.length > 44) {
    throw new Error("Solana mainnet address derivation failed.");
  }
  const evm = String(evmAddress || "");
  if (!/^0x[0-9a-fA-F]{40}$/.test(evm)) throw new Error("EVM address derivation failed.");
  return {
    bitcoin: { address: bitcoinPayment.address, path: "m/84'/0'/0'/0/0", addressType: "Native SegWit (P2WPKH)" },
    ethereum: { address: evm, path: "m/44'/60'/0'/0/0" },
    polygon: { address: evm, path: "m/44'/60'/0'/0/0" },
    solana: { address: solanaAddress, path: "m/44'/501'/0'/0'" },
    bsc: { address: evm, path: "m/44'/60'/0'/0/0" }
  };
}

function formatUnits(value, decimals, maxFraction = 8) {
  const n = BigInt(value);
  const base = 10n ** BigInt(decimals);
  const whole = n / base;
  const fraction = (n % base).toString().padStart(decimals, "0").slice(0, maxFraction).replace(/0+$/, "");
  return fraction ? whole.toString() + "." + fraction : whole.toString();
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
      credentials: "omit",
      headers: { "content-type": "application/json", ...(options.headers || {}) }
    });
    if (!response.ok) {
      const error = new Error("Network provider returned HTTP " + response.status + ".");
      error.status = response.status;
      throw error;
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function rpc(url, method, params = []) {
  const body = await fetchJson(url, {
    method: "POST",
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
  });
  if (body.error) throw new Error(body.error.message || "RPC request failed.");
  if (!Object.prototype.hasOwnProperty.call(body, "result")) throw new Error("Malformed RPC response.");
  return body.result;
}

function explainProviderError(error) {
  if (error?.name === "AbortError") return "Provider timed out. Try again.";
  if (error?.status === 429) return "Public provider rate limit reached. Try again later.";
  if (error?.status === 403) return "Provider refused this request. A different RPC provider may be needed.";
  return error?.message || "Network is temporarily unavailable.";
}

export async function readNetworkState(networkId, address) {
  const network = getNetwork(networkId);
  if (!address) return { id: networkId, online: false, error: "This import does not contain a derived address for this network." };
  try {
    if (network.family === "utxo") {
      const data = await fetchJson(network.api + "/address/" + encodeURIComponent(address));
      if (data.address !== address) throw new Error("Bitcoin API returned a mismatched address.");
      const confirmedSats = BigInt(data.chain_stats.funded_txo_sum) - BigInt(data.chain_stats.spent_txo_sum);
      const pendingSats = BigInt(data.mempool_stats.funded_txo_sum) - BigInt(data.mempool_stats.spent_txo_sum);
      const [height, txs] = await Promise.all([
        fetchJson(network.api + "/blocks/tip/height"),
        fetchJson(network.api + "/address/" + encodeURIComponent(address) + "/txs")
      ]);
      return {
        id: networkId, online: true, verifiedNetwork: true, symbol: network.symbol,
        balance: formatUnits(confirmedSats + pendingSats, 8, 8),
        confirmed: formatUnits(confirmedSats, 8, 8),
        pending: formatUnits(pendingSats, 8, 8),
        blockHeight: Number(height),
        transactionCount: Number(data.chain_stats.tx_count + data.mempool_stats.tx_count),
        history: Array.isArray(txs) ? txs.slice(0, 12).map((tx) => ({
          id: tx.txid, confirmed: Boolean(tx.status?.confirmed),
          blockHeight: tx.status?.block_height || null, timestamp: tx.status?.block_time || null,
          fee: tx.fee || 0, explorerUrl: network.explorer + "/tx/" + tx.txid
        })) : [],
        source: "Mempool.space"
      };
    }

    if (network.family === "solana") {
      const genesisHash = await rpc(network.rpc, "getGenesisHash");
      if (genesisHash !== network.genesisHash) throw new Error("Solana endpoint did not identify as Solana Mainnet.");
      const [balance, signatures, slot] = await Promise.all([
        rpc(network.rpc, "getBalance", [address, { commitment: "finalized" }]),
        rpc(network.rpc, "getSignaturesForAddress", [address, { limit: 12 }, { commitment: "finalized" }]),
        rpc(network.rpc, "getSlot", [{ commitment: "finalized" }])
      ]);
      return {
        id: networkId, online: true, verifiedNetwork: true, symbol: network.symbol,
        balance: formatUnits(balance.value, 9, 8), confirmed: formatUnits(balance.value, 9, 8),
        pending: "0", blockHeight: Number(slot),
        history: Array.isArray(signatures) ? signatures.map((tx) => ({
          id: tx.signature, confirmed: tx.confirmationStatus === "finalized",
          failed: Boolean(tx.err), timestamp: tx.blockTime || null,
          explorerUrl: network.explorer + "/tx/" + tx.signature + "?cluster=mainnet"
        })) : [],
        source: "Solana Mainnet RPC"
      };
    }

    const chainId = await rpc(network.rpc, "eth_chainId");
    if (String(chainId).toLowerCase() !== network.chainHex) {
      throw new Error("RPC chain ID mismatch. Expected " + network.chainId + ".");
    }
    const [balanceHex, blockHex] = await Promise.all([
      rpc(network.rpc, "eth_getBalance", [address, "latest"]),
      rpc(network.rpc, "eth_blockNumber")
    ]);
    const amount = BigInt(balanceHex);
    return {
      id: networkId, online: true, verifiedNetwork: true, symbol: network.symbol,
      balance: formatUnits(amount, 18, 8), confirmed: formatUnits(amount, 18, 8),
      pending: "0", blockHeight: Number(BigInt(blockHex)),
      history: null,
      source: "JSON-RPC · chain ID " + network.chainId,
      historyNote: "This public JSON-RPC endpoint does not provide address-indexed transaction history."
    };
  } catch (error) {
    return { id: networkId, online: false, verifiedNetwork: false, error: explainProviderError(error) };
  }
}

export async function verifyTransactionStatus(networkId, transactionId) {
  const network = getNetwork(networkId);
  const txid = String(transactionId || "").trim();
  if (!txid) throw new Error("Transaction ID is required.");

  if (network.family === "utxo") {
    const [status, height] = await Promise.all([
      fetchJson(network.api + "/tx/" + encodeURIComponent(txid) + "/status"),
      fetchJson(network.api + "/blocks/tip/height")
    ]);
    const confirmations = status.confirmed ? Math.max(0, Number(height) - Number(status.block_height) + 1) : 0;
    return {
      network: network.name, transactionId: txid, included: Boolean(status.confirmed),
      confirmed: Boolean(status.confirmed && confirmations >= 1), confirmations,
      blockHeight: status.block_height || null, explorerUrl: network.explorer + "/tx/" + txid
    };
  }

  if (network.family === "solana") {
    const genesisHash = await rpc(network.rpc, "getGenesisHash");
    if (genesisHash !== network.genesisHash) throw new Error("Solana endpoint network identity mismatch.");
    const result = await rpc(network.rpc, "getSignatureStatuses", [[txid], { searchTransactionHistory: true }]);
    const status = result?.value?.[0];
    if (!status) return { network: network.name, transactionId: txid, included: false, confirmed: false, state: "not found" };
    return {
      network: network.name, transactionId: txid, included: status.confirmationStatus !== "processed",
      confirmed: status.confirmationStatus === "finalized" && !status.err,
      failed: Boolean(status.err), state: status.confirmationStatus || "processed",
      slot: status.slot, explorerUrl: network.explorer + "/tx/" + txid + "?cluster=mainnet"
    };
  }

  const chainId = await rpc(network.rpc, "eth_chainId");
  if (String(chainId).toLowerCase() !== network.chainHex) throw new Error("RPC chain ID mismatch.");
  const receipt = await rpc(network.rpc, "eth_getTransactionReceipt", [txid]);
  if (!receipt) return { network: network.name, transactionId: txid, included: false, confirmed: false, state: "pending or not found" };
  const blockHex = await rpc(network.rpc, "eth_blockNumber");
  const confirmations = Math.max(0, Number(BigInt(blockHex) - BigInt(receipt.blockNumber) + 1n));
  let finalized = false;
  try {
    const finalizedBlock = await rpc(network.rpc, "eth_getBlockByNumber", ["finalized", false]);
    finalized = Boolean(finalizedBlock?.number && BigInt(receipt.blockNumber) <= BigInt(finalizedBlock.number));
  } catch {
    finalized = confirmations >= (network.id === "ethereum" ? 64 : 15);
  }
  return {
    network: network.name, transactionId: txid, included: true,
    confirmed: Boolean(finalized && receipt.status === "0x1"),
    failed: receipt.status === "0x0", confirmations,
    blockNumber: Number(BigInt(receipt.blockNumber)),
    explorerUrl: network.explorer + "/tx/" + txid
  };
}

export function addressForNetwork(wallet, networkId) {
  const network = getNetwork(networkId);
  if (wallet?.chainAccounts?.[networkId]?.address) return wallet.chainAccounts[networkId].address;
  if (network.family === "evm" && wallet?.address) return wallet.address;
  return "";
}
