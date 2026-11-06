import { Wallet, Mnemonic, isAddress, formatEther } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";

let KEY = "united.wallet.v1";
let wallets = [];
let activeWalletId = null;
let unlockedPassword = null;
let activeWallet = null;
let currentUser = null;
const $ = (id) => document.getElementById(id);

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const short = (s) => s ? s.slice(0, 8) + "…" + s.slice(-6) : "";

async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:310000,hash:"SHA-256"}, material, {name:"AES-GCM",length:256}, false, ["encrypt","decrypt"]);
}
const b64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = (value) => Uint8Array.from(atob(value), c => c.charCodeAt(0));

async function saveVault(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const payload = new TextEncoder().encode(JSON.stringify(wallets));
  const cipher = await crypto.subtle.encrypt({name:"AES-GCM",iv}, key, payload);
  localStorage.setItem(KEY, JSON.stringify({v:1,salt:b64(salt),iv:b64(iv),data:b64(cipher)}));
}
async function loadVault(password) {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  const box = JSON.parse(raw);
  const key = await deriveKey(password, unb64(box.salt));
  const plain = await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(box.iv)}, key, unb64(box.data));
  return JSON.parse(new TextDecoder().decode(plain));
}
function setNotice(message, type="info") {
  const el=$("wallet-notice"); if(!el)return;
  el.textContent=message; el.dataset.type=type; el.hidden=!message;
}
function showModal(title, body) {
  $("wallet-modal-title").textContent=title;
  $("wallet-modal-body").innerHTML=body;
  $("wallet-modal").hidden=false;
}
function closeModal(){ $("wallet-modal").hidden=true; }
function render() {
  const root=$("wallet-app"); if(!root)return;
  if(!wallets.length && !localStorage.getItem(KEY)) {
    root.innerHTML = `<div class="wallet-welcome"><div class="wallet-orbit">U</div><p class="wallet-eyebrow">UNITED NETWORK WALLET CREATION</p><h1>Create your UNITED wallet.</h1><p class="wallet-muted">Create a new self-custody wallet or restore an existing wallet. Your recovery phrase stays encrypted on this device.</p><div class="wallet-actions"><button class="wallet-primary" id="create-wallet">Create new wallet <b>→</b></button><button class="wallet-secondary" id="import-wallet">Import existing wallet</button></div><p class="wallet-footnote">No email or password required · Native UNIT wallet · Encrypted local storage</p></div>`;
    $("create-wallet").onclick=()=>createFlow();
    $("import-wallet").onclick=()=>importFlow();
    return;
  }
  if(!activeWallet) {
    root.innerHTML = `<div class="vault-lock"><div class="wallet-orbit">U</div><p class="wallet-eyebrow">ENCRYPTED LOCAL VAULT</p><h1>Unlock your wallet</h1><p class="wallet-muted">Your wallet data is encrypted on this device.</p><form id="unlock-form"><input id="vault-password" type="password" autocomplete="current-password" placeholder="Vault password" required minlength="10><button class="wallet-primary">Unlock wallet →</button></form><button id="add-wallet" class="wallet-text-button">Add another wallet</button><div id="wallet-notice" class="wallet-notice" hidden></div></div>`;
    $("unlock-form").onsubmit=async e=>{e.preventDefault();try{wallets=await loadVault($("vault-password").value);unlockedPassword=$("vault-password").value;activeWallet=wallets.find(w=>w.id===activeWalletId)||wallets[0];activeWalletId=activeWallet?.id;render();}catch{setNotice("Incorrect password or damaged local vault.","error");}};
    $("add-wallet").onclick=()=>importFlow();
    return;
  }
  const w=activeWallet;
  root.innerHTML = `
  <div class="wallet-dashboard">
    <header class="wallet-head"><div><p class="wallet-eyebrow">UNITED NETWORK</p><h1>My Wallet</h1></div><button id="wallet-menu" class="wallet-icon-button" aria-label="Wallet options">•••</button></header>
    <div class="wallet-network-pill"><i></i> UNITED TESTNET <span>·</span> UNIT</div>
    <section class="wallet-balance"><p>TOTAL BALANCE</p><h2>— <small>UNIT</small></h2><div class="wallet-address-line"><span>${esc(short(w.address))}</span><button id="copy-address">Copy address</button></div><small class="wallet-note">Live balance will appear when the UNITED RPC endpoint is connected.</small></section>
    <div class="wallet-quick-actions"><button id="receive-action"><span>↓</span>Receive</button><button id="send-action"><span>↑</span>Send</button><button id="backup-action"><span>◇</span>Backup</button></div>
    <section class="wallet-section"><div class="wallet-section-title"><h3>Your assets</h3><span>1 NETWORK ASSET</span></div><div class="wallet-asset"><div class="unit-coin">U</div><div class="asset-name"><b>UNIT</b><small>UNITED native coin</small></div><strong>— UNIT</strong></div></section>
    <section class="wallet-section"><div class="wallet-section-title"><h3>Activity</h3><span>ON-CHAIN</span></div><div class="wallet-empty"><div>↗</div><b>No transactions yet</b><p>Your UNITED transactions will appear here after network connection.</p></div></section>
    <div id="wallet-notice" class="wallet-notice" hidden></div>
    <footer class="wallet-bottom"><button class="active"><span>⌂</span>Home</button><button id="wallets-action"><span>▣</span>Wallets</button><button id="settings-action"><span>⚙</span>Settings</button></footer>
  </div>`;
  $("copy-address").onclick=async()=>{await navigator.clipboard.writeText(w.address);setNotice("Wallet address copied.","success");};
  $("receive-action").onclick=()=>showModal("Receive UNIT",`<p class="wallet-muted">Share this UNITED wallet address to receive native UNIT.</p><div class="wallet-address-box">${esc(w.address)}</div><button class="wallet-primary" id="modal-copy">Copy address</button>`);
  $("modal-copy")?.addEventListener("click",async()=>{await navigator.clipboard.writeText(w.address);closeModal();setNotice("Address copied.","success");});
  $("send-action").onclick=()=>showModal("Send UNIT",`<p class="wallet-muted">Sending is locked until the UNITED node RPC, chain ID and fee estimator are connected and verified. No transaction will be simulated or falsely marked as sent.</p><label>Recipient address</label><input disabled placeholder="UNITED address"><label>Amount (UNIT)</label><input disabled placeholder="0.00"><button class="wallet-primary" disabled>Network connection required</button>`);
  $("backup-action").onclick=()=>backupFlow();
  $("wallets-action").onclick=()=>walletList();
  $("settings-action").onclick=()=>settingsFlow();
  $("wallet-menu").onclick=()=>walletList();
}
function walletList(){
  const items=wallets.map(w=>`<button class="wallet-list-item" data-wallet="${w.id}"><span class="unit-coin">U</span><span><b>${esc(w.name)}</b><small>${esc(short(w.address))}</small></span><strong>${w.id===activeWalletId?"✓":"›"}</strong></button>`).join("");
  showModal("Your wallets",items+`<button id="wallet-add-more" class="wallet-secondary">＋ Add wallet</button>`);
  document.querySelectorAll("[data-wallet]").forEach(el=>el.onclick=()=>{activeWalletId=el.dataset.wallet;activeWallet=wallets.find(w=>w.id===activeWalletId);closeModal();render();});
  $("wallet-add-more").onclick=()=>importFlow();
}
async function createFlow(){
  showModal("Secure your wallet",`<p class="wallet-muted">Create a strong vault password. It encrypts your wallet locally and is not your UNITED account password.</p><form id="create-vault-form"><label>Vault password (10+ characters)</label><input id="new-vault-password" type="password" minlength="10" required autocomplete="new-password"><label>Confirm password</label><input id="confirm-vault-password" type="password" minlength="10" required><button class="wallet-primary">Generate recovery phrase →</button></form>`);
  $("create-vault-form").onsubmit=async e=>{e.preventDefault();const p=$("new-vault-password").value;if(p!==$("confirm-vault-password").value){setNotice("Passwords do not match.","error");return;}const w=Wallet.createRandom();const phrase=w.mnemonic.phrase;const derived=Wallet.fromPhrase(phrase);wallets=[{id:crypto.randomUUID(),name:"My UNITED Wallet",address:derived.address,phrase,createdAt:Date.now()}];activeWalletId=wallets[0].id;unlockedPassword=p;activeWallet=wallets[0];await saveVault(p);phraseFlow(phrase);};
}
function accountSyncFlow(){
  showModal("Save and sync your wallet?",`<p class="wallet-muted">Connect a Google account to associate this wallet with your UNITED account. This is optional. Your recovery phrase and private keys stay encrypted locally and are never uploaded.</p><button class="wallet-primary" id="connect-google-wallet">Continue with Google</button><button class="wallet-secondary" id="skip-google-wallet" style="margin-top:10px">Skip for now</button>`);
  $("connect-google-wallet").onclick=()=>window.dispatchEvent(new Event("united-google-connect"));
  $("skip-google-wallet").onclick=()=>protectWalletFlow();
}
function protectWalletFlow(){
  const raw=localStorage.getItem(KEY);
  showModal("Download your wallet backup",`<p class="wallet-muted">Download an encrypted backup so you can restore this wallet if you change or lose this device. The backup file is protected by your vault password. You can also skip this and download it later in Settings.</p><button class="wallet-primary" id="download-wallet-backup">Download encrypted backup</button><button class="wallet-secondary" id="skip-wallet-backup" style="margin-top:10px">Skip for now</button><p class="wallet-footnote">You can manage Google account connection and backup options later in Settings. Never share your recovery phrase.</p>`);
  $("download-wallet-backup").onclick=()=>{
    const blob=new Blob([JSON.stringify({format:"UNITED encrypted wallet backup",version:1,backup:JSON.parse(raw||"null")},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="united-wallet-backup.json";a.click();URL.revokeObjectURL(url);
    $("download-wallet-backup").textContent="Backup downloaded";
  };
  $("skip-wallet-backup").onclick=()=>{closeModal();render();setNotice("Wallet created. You can download an encrypted backup later in Settings.","success");};
}
function phraseFlow(phrase){
  const words=phrase.split(" ");
  showModal("Back up your recovery phrase",`<div class="wallet-warning">Anyone with this phrase can control your wallet. Never share it. UNITED will never ask you to send it to support.</div><div class="phrase-grid">${words.map((w,i)=>`<div><small>${i+1}</small><b>${esc(w)}</b></div>`).join("")}</div><label class="wallet-check"><input type="checkbox" id="phrase-confirm"> I have written down my recovery phrase and stored it safely.</label><button class="wallet-primary" id="phrase-done" disabled>I've saved my phrase →</button>`);
  $("phrase-confirm").onchange=e=>$("phrase-done").disabled=!e.target.checked;
  $("phrase-done").onclick=()=>{accountSyncFlow();};
}
async function importFlow(){
  showModal("Import UNITED wallet",`<p class="wallet-muted">Restore an existing EVM-compatible UNITED wallet with its 12- or 24-word recovery phrase. The phrase is processed locally and encrypted before storage.</p><form id="import-form"><label>Recovery phrase</label><textarea id="import-phrase" rows="4" placeholder="Enter your recovery phrase" required></textarea><label>Wallet name</label><input id="import-name" value="Imported UNITED Wallet" required><label>Vault password (10+ characters)</label><input id="import-password" type="password" minlength="10" required><button class="wallet-primary">Import wallet →</button></form>`);
  $("import-form").onsubmit=async e=>{e.preventDefault();try{const phrase=$("import-phrase").value.trim().toLowerCase().replace(/\s+/g," ");let w;try{w=Wallet.fromPhrase(phrase);}catch{throw new Error("Recovery phrase is not valid.");}const p=$("import-password").value;if(wallets.length&&unlockedPassword!==p)throw new Error("Use your existing vault password to add a wallet.");wallets.push({id:crypto.randomUUID(),name:$("import-name").value.trim(),address:w.address,phrase,createdAt:Date.now()});activeWallet=wallets.at(-1);activeWalletId=activeWallet.id;unlockedPassword=p;await saveVault(p);closeModal();render();setNotice("Wallet imported and encrypted locally.","success");}catch(err){setNotice(err.message||"Could not import wallet.","error");}};
}
async function backupFlow(){
  const w=activeWallet;
  showModal("Recovery phrase",`<div class="wallet-warning">Sensitive information. Anyone who sees this phrase can take your funds. Make sure nobody is looking at your screen.</div><button id="reveal-phrase" class="wallet-secondary">Reveal recovery phrase</button><div id="revealed-phrase" class="phrase-hidden">Hidden for your protection</div>`);
  $("reveal-phrase").onclick=()=>{$("revealed-phrase").className="phrase-grid";$("revealed-phrase").innerHTML=w.phrase.split(" ").map((x,i)=>`<div><small>${i+1}</small><b>${esc(x)}</b></div>`).join("");$("reveal-phrase").disabled=true;};
}
function settingsFlow(){
  showModal("Wallet settings",`<div class="wallet-setting-row"><span><b>Google account</b><small>Optional account connection. Cloud wallet sync is not enabled yet.</small></span><button id="google-connect">Connect</button></div><div class="wallet-setting-row"><span><b>Wallet name</b><small>${esc(activeWallet.name)}</small></span><button id="rename-wallet">Rename</button></div><div class="wallet-setting-row"><span><b>Remove this wallet</b><small>Erase its local encrypted key data from this device.</small></span><button id="delete-wallet" class="wallet-danger">Remove</button></div><div class="wallet-setting-row"><span><b>Lock wallet</b><small>Clear decrypted key material from memory.</small></span><button id="lock-wallet">Lock</button></div>`);
  $("google-connect").onclick=()=>window.dispatchEvent(new Event("united-google-connect"));
  $("rename-wallet").onclick=()=>{const n=prompt("New wallet name",activeWallet.name);if(n?.trim()){activeWallet.name=n.trim();saveVault(unlockedPassword).then(()=>{closeModal();render();});}};
  $("delete-wallet").onclick=()=>{showModal("Remove wallet?",`<div class="wallet-warning">This only removes the encrypted wallet from this device. It does not delete the address, reverse transactions, or move UNIT on the blockchain. Make sure you have a verified recovery phrase.</div><label>Type REMOVE to confirm</label><input id="delete-confirm" placeholder="REMOVE"><button id="confirm-delete" class="wallet-danger-button">Remove wallet permanently</button>`);$("confirm-delete").onclick=async()=>{if($("delete-confirm").value!=="REMOVE")return;wallets=wallets.filter(w=>w.id!==activeWalletId);activeWallet=null;activeWalletId=null;if(wallets.length){await saveVault(unlockedPassword);render();}else{localStorage.removeItem(KEY);unlockedPassword=null;render();}closeModal();};};
  $("lock-wallet").onclick=()=>{activeWallet=null;unlockedPassword=null;render();};
}
export function mountUnitedWallet(user){
  currentUser=user;
  KEY = "united.wallet.v1." + user.uid;
  $("wallet-modal-close")?.addEventListener("click", closeModal);
  const raw=localStorage.getItem(KEY);
  if(raw){try{const parsed=JSON.parse(raw);activeWalletId=parsed.activeWalletId||null;}catch{}}
  wallets=[];activeWallet=null;unlockedPassword=null;render();
}
