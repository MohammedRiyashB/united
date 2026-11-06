import { Wallet } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";
import { NETWORKS, deriveMultiChainAccounts, readNetworkState, verifyTransactionStatus, addressForNetwork } from "./chains.js";

let KEY = "united.wallet.v1.device";
let wallets = [];
let activeWalletId = null;
let unlockedPassword = null;
let activeWallet = null;
let currentUser = null;
let importKind = "phrase";
let activeChainId = localStorage.getItem("united.active.network") || "bitcoin";
let networkStates = {};
let networkRefreshToken = 0;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const short = (s) => s ? s.slice(0, 8) + "…" + s.slice(-6) : "";
const secretOf = (w) => w.secret || w.phrase || "";

function logoMark(size=70) {
  return `<svg class="united-mark" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="UNITED logo">
    <defs><linearGradient id="unitedLogoGradient" x1="12%" y1="0%" x2="92%" y2="100%"><stop offset="0" stop-color="#45efff"/><stop offset=".48" stop-color="#087eff"/><stop offset="1" stop-color="#704dff"/></linearGradient></defs>
    <path d="M19 17h18v40c0 12 5 18 13 18s13-6 13-18V17h18v42c0 23-12 37-31 37S19 82 19 59V17Z" fill="url(#unitedLogoGradient)"/>
    <path d="M19 17 37 17 37 40 19 58Z" fill="#18d8fa" opacity=".94"/>
    <path d="M63 17h18v23L63 58Z" fill="#3279ff" opacity=".92"/>
    <path d="M37 74 50 88 63 74" fill="none" stroke="#62dfff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>
  </svg>`;
}

function globeArt() {
  return `<svg class="welcome-globe" viewBox="0 0 520 230" aria-hidden="true">
    <defs><radialGradient id="earthFill" cx="50%" cy="20%" r="80%"><stop stop-color="#2bcfff" stop-opacity=".42"/><stop offset=".5" stop-color="#1256b9" stop-opacity=".55"/><stop offset="1" stop-color="#091637" stop-opacity=".98"/></radialGradient><linearGradient id="earthEdge" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#43ecff"/><stop offset=".55" stop-color="#287dff"/><stop offset="1" stop-color="#865cff"/></linearGradient></defs>
    <ellipse cx="260" cy="206" rx="220" ry="15" fill="#087dff" opacity=".24" filter="blur(10px)"/>
    <circle cx="260" cy="150" r="160" fill="url(#earthFill)" stroke="url(#earthEdge)" stroke-width="2"/>
    <path d="M110 103Q260 23 410 103M95 151Q260 94 425 151M119 203Q260 255 401 203M260 -7Q160 150 260 307M260 -7Q360 150 260 307" fill="none" stroke="#4ecfff" stroke-opacity=".32" stroke-width="1.4"/>
    <path d="M140 67 175 52 188 73 220 78 232 102 209 121 196 148 164 143 151 119 124 111Z M289 62 327 55 354 79 347 104 370 123 350 145 320 138 305 116 278 103Z M220 160 248 147 274 167 268 196 244 212 215 194Z" fill="#2ebef2" opacity=".23"/>
    <path d="M100 149A160 160 0 0 0 420 149" fill="none" stroke="#48dfff" stroke-width="2" opacity=".65"/>
    <g fill="#8df5ff"><circle cx="154" cy="91" r="3"/><circle cx="344" cy="114" r="2.6"/><circle cx="260" cy="41" r="2.5"/><circle cx="212" cy="182" r="2.4"/></g>
  </svg>`;
}

function walletArt() {
  return `<svg class="wallet-art" viewBox="0 0 360 250" role="img" aria-label="Glowing United wallet illustration">
    <defs><linearGradient id="walletBody" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#32dfff"/><stop offset=".48" stop-color="#0878ff"/><stop offset="1" stop-color="#7652ff"/></linearGradient><linearGradient id="walletSide" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#123f9a"/><stop offset="1" stop-color="#07142f"/></linearGradient><filter id="walletGlow"><feGaussianBlur stdDeviation="12"/></filter></defs>
    <ellipse cx="180" cy="214" rx="135" ry="16" fill="#087bff" opacity=".65" filter="url(#walletGlow)"/>
    <ellipse cx="180" cy="211" rx="130" ry="12" fill="none" stroke="#5c83ff" stroke-width="2" opacity=".7"/>
    <path d="M53 88Q53 68 74 62L235 31Q255 27 265 45L298 91 298 185Q298 201 279 206L91 224Q58 223 53 201Z" fill="url(#walletSide)" stroke="#2fbfff" stroke-width="2"/>
    <path d="M58 86 237 49Q259 44 276 62L303 93 118 128Q95 132 79 119Z" fill="#0a2c6e" stroke="#3acfff" stroke-width="2"/>
    <path d="M55 103 248 64Q270 60 285 78L314 110 314 180Q314 196 296 201L99 222Q75 224 64 205Z" fill="url(#walletBody)" stroke="#63eaff" stroke-width="2.4"/>
    <path d="M72 116 263 78Q279 75 291 89L312 111 122 148Q100 152 84 137Z" fill="#0b4fc3" opacity=".8"/>
    <rect x="228" y="118" width="100" height="65" rx="15" fill="#142e77" stroke="#58dfff" stroke-width="2"/>
    <circle cx="258" cy="150" r="8" fill="#71efff"/><circle cx="258" cy="150" r="3" fill="#102553"/>
    <path d="M146 152 166 152 166 185Q166 197 178 197Q190 197 190 185V152H210V185Q210 218 178 218Q146 218 146 185Z" fill="#081c4a" stroke="#53dcff" stroke-width="2" opacity=".95"/>
    <rect x="160" y="177" width="36" height="31" rx="8" fill="#081b49" stroke="#78eaff" stroke-width="2"/>
    <path d="M169 177V169Q169 157 178 157Q187 157 187 169V177" fill="none" stroke="#8defff" stroke-width="5"/>
    <circle cx="178" cy="191" r="3" fill="#8defff"/>
  </svg>`;
}

async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:310000,hash:"SHA-256"}, material, {name:"AES-GCM",length:256}, false, ["encrypt","decrypt"]);
}
const b64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = (value) => Uint8Array.from(atob(value), c => c.charCodeAt(0));

async function saveVault(password) {
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await deriveKey(password,salt);
  const payload=new TextEncoder().encode(JSON.stringify(wallets));
  const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,payload);
  localStorage.setItem(KEY,JSON.stringify({v:1,salt:b64(salt),iv:b64(iv),data:b64(cipher)}));
}
async function loadVault(password) {
  const raw=localStorage.getItem(KEY); if(!raw)return [];
  const box=JSON.parse(raw);
  const key=await deriveKey(password,unb64(box.salt));
  const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(box.iv)},key,unb64(box.data));
  return JSON.parse(new TextDecoder().decode(plain));
}

function setNotice(message,type="info") {
  const el=$("wallet-notice"); if(!el)return;
  el.textContent=message; el.dataset.type=type; el.hidden=!message;
}
function pageShell(content) {
  const root=$("wallet-app"); if(root)root.innerHTML=`<div class="united-wallet-app">${content}</div>`;
}
function backButton(target="home") {
  return `<button class="uw-back" data-back="${target}" aria-label="Go back">‹</button>`;
}
function bindBack(defaultTarget="home") {
  document.querySelectorAll("[data-back]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.back||defaultTarget)));
}
function navigate(page) {
  if(page==="home")renderHome();
  else if(page==="create")renderCreate();
  else if(page==="import")renderImport();
  else if(page==="dashboard")renderDashboard();
  else if(page==="activity")renderActivity();
  else if(page==="explore")renderExplore();
  else if(page==="settings")renderSettings();
  else if(page==="vault")renderVaultUnlock();
}

function renderHome() {
  if(wallets.length && activeWallet){renderDashboard();return;}
  if(localStorage.getItem(KEY)){renderVaultUnlock();return;}
  pageShell(`
    <header class="uw-home-header"><div class="uw-language">◎ EN⌄</div></header>
    <section class="uw-welcome">
      <div class="uw-brand-large">${logoMark(96)}<div>UNITED</div><small>NETWORK</small></div>
      <div class="uw-earth-wrap">${globeArt()}</div>
      <h1>Your money.<br><span>Your control.</span></h1>
      <p class="uw-subtitle">A secure home for your digital assets.</p>
      <div class="uw-home-actions">
        <button class="uw-btn uw-btn-primary" id="home-create"><span class="uw-btn-icon">＋</span>Create a new wallet <b>›</b></button>
        <button class="uw-btn uw-btn-glass" id="home-import"><span class="uw-btn-icon">⇩</span>Import existing wallet <b>›</b></button>
        <div class="uw-or"><i></i>OR<i></i></div>
        <button class="uw-google-button" id="home-google"><span class="uw-google-g">G</span>Continue with Google <b>›</b></button>
      </div>
      <div class="uw-self-custody"><span>♢</span> Self-custody · You control your keys</div>
    </section>
  `);
  $("home-create").onclick=()=>navigate("create");
  $("home-import").onclick=()=>navigate("import");
  $("home-google").onclick=()=>window.dispatchEvent(new Event("united-google-connect"));
}

function renderCreate() {
  pageShell(`
    <div class="uw-flow-page">
      <header class="uw-flow-header">${backButton("home")}<span class="uw-step-label">WALLET SETUP</span></header>
      <h1>Create your wallet</h1>
      <p class="uw-subtitle">A new, secure wallet will be generated for you. You'll get a recovery phrase to back it up and restore anytime.</p>
      <div class="uw-art-stage">${walletArt()}</div>
      <div class="uw-flow-bottom">
        <button class="uw-btn uw-btn-primary" id="begin-create">Create wallet <b>›</b></button>
        <div class="uw-security-note"><span>ⓘ</span><p>Keep your recovery phrase safe and private. It's the only way to recover your wallet if you lose access.</p></div>
      </div>
    </div>
  `);
  bindBack();
  $("begin-create").onclick=renderCreatePassword;
}

function renderCreatePassword() {
  pageShell(`
    <div class="uw-flow-page">
      <header class="uw-flow-header">${backButton("create")}<span class="uw-step-label">LOCAL SECURITY</span></header>
      <h1>Secure your wallet</h1>
      <p class="uw-subtitle">Set a password to encrypt your wallet on this device. This is not an email or account password.</p>
      <form class="uw-form" id="create-vault-form">
        <label for="new-vault-password">Wallet password</label><input id="new-vault-password" type="password" minlength="10" autocomplete="new-password" placeholder="At least 10 characters" required>
        <label for="confirm-vault-password">Confirm password</label><input id="confirm-vault-password" type="password" minlength="10" autocomplete="new-password" placeholder="Re-enter password" required>
        <p class="uw-form-hint">This password encrypts the local wallet vault. UNITED cannot reset it.</p>
        <button class="uw-btn uw-btn-primary" type="submit">Generate wallet <b>›</b></button>
        <p id="wallet-inline-error" class="uw-inline-error" hidden></p>
      </form>
    </div>
  `);
  bindBack("create");
  $("create-vault-form").onsubmit=async e=>{
    e.preventDefault();
    const p=$("new-vault-password").value;
    if(p!==$("confirm-vault-password").value){$("wallet-inline-error").textContent="The passwords do not match."; $("wallet-inline-error").hidden=false;return;}
    try{
      const submit=$("create-vault-form").querySelector('button[type="submit"]');
      submit.disabled=true; submit.textContent="Initializing five mainnets…";
      const generated=Wallet.createRandom();
      const phrase=generated.mnemonic.phrase;
      const evmAddress=Wallet.fromPhrase(phrase).address;
      const chainAccounts=await deriveMultiChainAccounts(phrase,evmAddress);
      const created={id:crypto.randomUUID(),name:"My UNITED Wallet",address:evmAddress,chainAccounts,secretType:"mnemonic",secret:phrase,createdAt:Date.now()};
      wallets=[created];activeWallet=created;activeWalletId=created.id;unlockedPassword=p;
      await saveVault(p);renderPhrase(phrase);
    }catch(err){
      const submit=$("create-vault-form")?.querySelector('button[type="submit"]');
      if(submit){submit.disabled=false;submit.textContent="Generate wallet ›";}
      $("wallet-inline-error").textContent=err.message||"Wallet creation failed.";
      $("wallet-inline-error").hidden=false;
    }
  };
}

function renderPhrase(phrase) {
  const words=phrase.split(" ");
  pageShell(`
    <div class="uw-flow-page">
      <header class="uw-flow-header">${backButton("dashboard")}<span class="uw-step-label">BACKUP YOUR WALLET · 1/2</span></header>
      <h1>Secret recovery phrase</h1>
      <p class="uw-subtitle">Write these words down in the correct order and store them somewhere private. Anyone with this phrase can access your wallet.</p>
      <div class="uw-warning"><b>Never share your recovery phrase.</b><span>UNITED support will never ask you to reveal it.</span></div>
      <div class="uw-phrase-grid">${words.map((word,i)=>`<div><small>${i+1}</small><b>${esc(word)}</b></div>`).join("")}</div>
      <label class="uw-check"><input type="checkbox" id="phrase-confirm"><span>I have saved my recovery phrase in a safe place.</span></label>
      <button class="uw-btn uw-btn-primary" id="phrase-done" disabled>Continue <b>›</b></button>
    </div>
  `);
  bindBack("create");
  $("phrase-confirm").onchange=e=>$("phrase-done").disabled=!e.target.checked;
  $("phrase-done").onclick=renderGoogleOffer;
}

function renderImport() {
  importKind="phrase";
  pageShell(`
    <div class="uw-flow-page">
      <header class="uw-flow-header">${backButton("home")}<span class="uw-step-label">RESTORE WALLET</span></header>
      <h1>Import wallet</h1>
      <p class="uw-subtitle">Restore your existing wallet using your recovery phrase or private key.</p>
      <div class="uw-tabs"><button class="active" data-import-kind="phrase">Recovery phrase</button><button data-import-kind="private">Private key</button></div>
      <form class="uw-form" id="import-form">
        <label id="import-secret-label" for="import-secret">Recovery phrase</label>
        <textarea id="import-secret" rows="4" placeholder="Enter your recovery phrase (12 or 24 words)" required></textarea>
        <label for="import-name">Wallet name</label><input id="import-name" value="Imported UNITED Wallet" required>
        <label for="import-password">Wallet password (10+ characters)</label><input id="import-password" type="password" minlength="10" autocomplete="new-password" placeholder="Create local vault password" required>
        <button class="uw-btn uw-btn-primary" type="submit">Import wallet <b>›</b></button>
        <p id="wallet-inline-error" class="uw-inline-error" hidden></p>
      </form>
      <div class="uw-warning"><b>Never share your recovery phrase.</b><span>Import is processed locally in this browser.</span></div>
    </div>
  `);
  bindBack("home");
  document.querySelectorAll("[data-import-kind]").forEach(btn=>btn.onclick=()=>{
    importKind=btn.dataset.importKind;
    document.querySelectorAll("[data-import-kind]").forEach(x=>x.classList.toggle("active",x===btn));
    $("import-secret-label").textContent=importKind==="phrase"?"Recovery phrase":"Private key";
    $("import-secret").placeholder=importKind==="phrase"?"Enter your recovery phrase (12 or 24 words)":"Paste your private key";
  });
  $("import-form").onsubmit=async e=>{
    e.preventDefault();
    try{
      const submit=$("import-form").querySelector('button[type="submit"]');
      submit.disabled=true;submit.textContent="Initializing networks…";
      const secret=$("import-secret").value.trim();
      let imported,normalizedSecret;
      if(importKind==="phrase"){
        const phrase=secret.toLowerCase().replace(/\s+/g," ");
        imported=Wallet.fromPhrase(phrase);normalizedSecret=phrase;
      }else{
        imported=new Wallet(secret);normalizedSecret=secret;
      }
      const p=$("import-password").value;
      const chainAccounts=importKind==="phrase"
        ? await deriveMultiChainAccounts(normalizedSecret,imported.address)
        : {
            ethereum:{address:imported.address,path:"imported EVM private key"},
            polygon:{address:imported.address,path:"imported EVM private key"},
            bsc:{address:imported.address,path:"imported EVM private key"}
          };
      const entry={id:crypto.randomUUID(),name:$("import-name").value.trim()||"Imported UNITED Wallet",address:imported.address,chainAccounts,secretType:importKind==="phrase"?"mnemonic":"privateKey",secret:normalizedSecret,createdAt:Date.now()};
      if(wallets.length && unlockedPassword!==p)throw new Error("Unlock your existing wallet first to add another wallet.");
      wallets.push(entry);activeWallet=entry;activeWalletId=entry.id;unlockedPassword=p;
      await saveVault(p);renderGoogleOffer();
    }catch(err){
      const submit=$("import-form")?.querySelector('button[type="submit"]');
      if(submit){submit.disabled=false;submit.textContent="Import wallet ›";}
      $("wallet-inline-error").textContent=err.message||"The wallet could not be imported.";
      $("wallet-inline-error").hidden=false;
    }
  };
}

function renderGoogleOffer() {
  pageShell(`
    <div class="uw-google-step">
      <header class="uw-flow-header">${backButton("home")}<span class="uw-step-label">OPTIONAL ACCOUNT LINK</span></header>
      <div class="uw-google-emblem"><span>G</span></div>
      <h1>Connect your<br>Google account</h1>
      <p class="uw-subtitle">Link your Google account for a smoother experience across your devices (optional).</p>
      <button class="uw-google-button uw-google-continue" id="connect-google-wallet"><span class="uw-google-g">G</span>Continue with Google <b>›</b></button>
      <button class="uw-skip-button" id="skip-google-wallet">Skip for now</button>
      <div class="uw-security-note"><span>ⓘ</span><p>Google sign-in is optional. It does not replace your wallet recovery phrase. Cloud wallet sync is not enabled; your keys remain on this device.</p></div>
    </div>
  `);
  bindBack("home");
  $("connect-google-wallet").onclick=()=>{
    const connected=()=>{window.removeEventListener("united-google-connected",connected);renderBackupOffer();};
    window.addEventListener("united-google-connected",connected);
    window.dispatchEvent(new Event("united-google-connect"));
  };
  $("skip-google-wallet").onclick=renderBackupOffer;
}

function renderBackupOffer() {
  pageShell(`
    <div class="uw-flow-page">
      <header class="uw-flow-header">${backButton("home")}<span class="uw-step-label">BACKUP YOUR WALLET · 2/2</span></header>
      <h1>Keep a backup</h1>
      <p class="uw-subtitle">Download an encrypted copy of your local wallet vault. You'll need your wallet password to restore it.</p>
      <div class="uw-backup-card"><div class="uw-backup-icon">⇩</div><b>Encrypted United wallet backup</b><span>Private keys are encrypted before the file is created.</span></div>
      <button class="uw-btn uw-btn-primary" id="download-wallet-backup">Download backup <b>↓</b></button>
      <button class="uw-skip-button" id="skip-wallet-backup">Skip for now</button>
      <p id="backup-status" class="uw-form-hint" aria-live="polite"></p>
    </div>
  `);
  bindBack("home");
  $("download-wallet-backup").onclick=()=>{
    try{
      const raw=localStorage.getItem(KEY);
      const blob=new Blob([JSON.stringify({format:"UNITED encrypted wallet backup",version:1,backup:JSON.parse(raw||"null")},null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="united-wallet-backup.json";a.click();URL.revokeObjectURL(url);
      $("backup-status").textContent="Encrypted backup downloaded. Keep it private.";
    }catch(err){$("backup-status").textContent="Backup download failed: "+err.message;}
  };
  $("skip-wallet-backup").onclick=()=>{renderDashboard();};
}

function renderDashboard() {
  if(!activeWallet){if(localStorage.getItem(KEY)){renderVaultUnlock();return;}renderHome();return;}
  const selectedNetwork=NETWORKS.find(n=>n.id===activeChainId)||NETWORKS[0];
  activeChainId=selectedNetwork.id;
  const selectedAddress=addressForNetwork(activeWallet,selectedNetwork.id);
  const selectedState=networkStates[selectedNetwork.id];
  pageShell(`
    <div class="uw-dashboard">
      <header class="uw-dashboard-header">
        <div class="uw-dashboard-brand">${logoMark(34)}<b>UNITED</b></div>
        <div class="uw-header-actions"><button aria-label="Refresh network data" title="Refresh" id="refresh-networks">↻</button><button aria-label="Notifications" title="Notifications" data-coming="Notifications">♧</button></div>
      </header>
      <label class="uw-network-label" for="network-picker">ACTIVE MAINNET</label>
      <select class="uw-network-picker" id="network-picker">${NETWORKS.map(n=>`<option value="${n.id}" ${n.id===activeChainId?"selected":""}>${esc(n.name)}</option>`).join("")}</select>
      <section class="uw-total-card">
        <div class="uw-total-heading">Native balance · ${esc(selectedNetwork.name)}</div>
        <div class="uw-total-value" id="selected-balance">${selectedState?.online?esc(selectedState.balance):"—"} <small>${selectedNetwork.symbol}</small></div>
        <div class="uw-total-foot" id="selected-network-status">${selectedState?.online?"Verified mainnet connection":"Checking real mainnet connection…"}</div>
        <div class="uw-total-logo">${logoMark(100)}</div>
      </section>
      <div class="uw-action-grid">
        <button id="send-action" disabled title="Send is locked until chain-specific signing and broadcast tests pass"><span>↗</span>Send</button>
        <button id="receive-action"><span>↓</span>Receive</button>
        <button id="swap-action"><span>⇄</span>Swap</button>
        <button id="buy-action"><span>▣</span>Buy</button>
      </div>
      <section class="uw-assets-section">
        <div class="uw-section-heading"><b>All networks</b><button id="refresh-list">Refresh ›</button></div>
        <div class="uw-chain-list" id="chain-list">${NETWORKS.map(n=>renderNetworkRow(n)).join("")}</div>
      </section>
      <section class="uw-activity-section">
        <div class="uw-section-heading"><b>Recent activity · ${esc(selectedNetwork.symbol)}</b><button id="activity-view">View all ›</button></div>
        <div class="uw-activity-empty" id="dashboard-activity"><span>↘</span><b>Loading verified activity</b><small>Only chain-reported transactions will be shown.</small></div>
      </section>
      <div class="uw-address-strip"><span id="selected-address">${selectedAddress?esc(short(selectedAddress)):"No address for this import"}</span><button id="copy-address" ${selectedAddress?"":"disabled"}>Copy address</button></div>
      <p class="uw-form-hint">Public mainnet RPCs may be rate-limited. Balances are chain-reported native coin amounts, not fiat valuations.</p>
      <nav class="uw-bottom-nav"><button class="active" data-nav="dashboard"><span>⌂</span>Home</button><button data-nav="activity"><span>◷</span>Activity</button><button data-nav="explore"><span>◈</span>Explore</button><button data-nav="settings"><span>⚙</span>Settings</button></nav>
      <div id="wallet-notice" class="uw-notice" hidden></div>
    </div>
  `);
  $("network-picker").onchange=e=>{activeChainId=e.target.value;localStorage.setItem("united.active.network",activeChainId);renderDashboard();};
  $("refresh-networks").onclick=refreshAllNetworkStates;
  $("refresh-list").onclick=refreshAllNetworkStates;
  $("send-action").onclick=()=>showInfo("Send temporarily unavailable","UNITED will enable sending only after each network's signing, fee estimation, transaction broadcast and confirmation workflow passes end-to-end testing. No transaction will be simulated.");
  $("receive-action").onclick=renderReceive;
  $("swap-action").onclick=()=>showInfo("Swap not initialized","Swap routes, quotes, approval handling and execution are not yet connected.");
  $("buy-action").onclick=()=>showInfo("Buy crypto not initialized","Fiat on-ramp providers and regional availability have not yet been integrated.");
  $("activity-view").onclick=()=>navigate("activity");
  $("copy-address").onclick=async()=>{const addr=addressForNetwork(activeWallet,activeChainId);if(!addr)return;try{await navigator.clipboard.writeText(addr);setNotice("Public address copied.","success");}catch{showInfo("Public address",esc(addr));}};
  document.querySelectorAll("[data-chain]").forEach(b=>b.onclick=()=>{activeChainId=b.dataset.chain;localStorage.setItem("united.active.network",activeChainId);renderDashboard();});
  document.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>navigate(b.dataset.nav));
  document.querySelectorAll("[data-coming]").forEach(b=>b.onclick=()=>showInfo(b.dataset.coming,"This feature is not connected yet."));
  updateDashboardNetworkSummary();
  refreshAllNetworkStates();
}

function renderNetworkRow(network) {
  const address=addressForNetwork(activeWallet,network.id);
  const state=networkStates[network.id];
  const selected=network.id===activeChainId;
  const balance=state?.online?state.balance+" "+network.symbol:(address?(state?.error||"Connecting…"):"Address unavailable for this import");
  const status=state?.online?"RPC verified · block "+Number(state.blockHeight||0).toLocaleString():(state?.error||"Not checked");
  return `<button class="uw-chain-row ${selected?"selected":""}" data-chain="${network.id}">
    <span class="uw-chain-symbol">${network.id==="bitcoin"?"₿":network.id==="ethereum"?"Ξ":network.id==="polygon"?"⬡":network.id==="solana"?"◎":"◆"}</span>
    <span class="uw-chain-copy"><b>${esc(network.name)}</b><small>${address?esc(short(address)):"No derived address"}</small></span>
    <span class="uw-chain-balance"><b>${esc(balance)}</b><small>${esc(status)}</small></span>
  </button>`;
}

function updateDashboardNetworkSummary() {
  const network=NETWORKS.find(n=>n.id===activeChainId)||NETWORKS[0];
  const state=networkStates[network.id];
  const address=addressForNetwork(activeWallet,network.id);
  const balance=$("selected-balance");
  const status=$("selected-network-status");
  const addressLine=$("selected-address");
  const copy=$("copy-address");
  if(balance)balance.innerHTML=(state?.online?esc(state.balance):"—")+ " <small>"+network.symbol+"</small>";
  if(status)status.textContent=state?.online
    ? "Network verified · "+state.source+" · Block "+Number(state.blockHeight||0).toLocaleString()
    : (state?.error||"Checking real mainnet connection…");
  if(addressLine)addressLine.textContent=address?short(address):"Address unavailable for this import";
  if(copy)copy.disabled=!address;
  const list=$("chain-list");
  if(list)list.innerHTML=NETWORKS.map(n=>renderNetworkRow(n)).join("");
  const activity=$("dashboard-activity");
  if(activity){
    const history=state?.history;
    if(Array.isArray(history)&&history.length){
      activity.innerHTML=history.slice(0,3).map(tx=>`<div class="uw-mini-tx"><b>${tx.confirmed?"Confirmed":"Pending"} · ${esc(network.symbol)}</b><small>${esc(short(tx.id))} · ${tx.timestamp?new Date(tx.timestamp*1000).toLocaleString():"time unavailable"}</small></div>`).join("");
    }else if(state?.online){
      activity.innerHTML=`<b>No indexed recent activity</b><small>${esc(state.historyNote||"No transactions were returned for this address.")}</small>`;
    }else{
      activity.innerHTML=`<b>Activity unavailable</b><small>${esc(state?.error||"Waiting for network connection.")}</small>`;
    }
  }
}

async function refreshAllNetworkStates() {
  if(!activeWallet)return;
  const token=++networkRefreshToken;
  const tasks=NETWORKS.map(async network=>{
    const address=addressForNetwork(activeWallet,network.id);
    if(!address){
      networkStates[network.id]={id:network.id,online:false,error:"Import a recovery phrase to derive this network address."};
      return;
    }
    networkStates[network.id]=await readNetworkState(network.id,address);
  });
  await Promise.all(tasks);
  if(token!==networkRefreshToken||!$("chain-list"))return;
  updateDashboardNetworkSummary();
}

function renderReceive() {
  const defaultNetwork=NETWORKS.find(n=>n.id===activeChainId)||NETWORKS[0];
  pageShell(`
    <div class="uw-flow-page">
      <header class="uw-flow-header">${backButton("dashboard")}<span class="uw-step-label">RECEIVE CRYPTO</span></header>
      <h1>Receive assets</h1>
      <p class="uw-subtitle">Choose the exact mainnet. Only send the selected asset over its matching network.</p>
      <label class="uw-network-label" for="receive-network">NETWORK</label>
      <select class="uw-network-picker" id="receive-network">${NETWORKS.map(n=>`<option value="${n.id}" ${n.id===defaultNetwork.id?"selected":""}>${esc(n.name)} · ${n.symbol}</option>`).join("")}</select>
      <div class="uw-receive-card">
        <div class="uw-receive-icon">${logoMark(58)}</div>
        <b id="receive-asset-name">${esc(defaultNetwork.name)} address</b>
        <code id="receive-address">${esc(addressForNetwork(activeWallet,defaultNetwork.id)||"Not available for this import")}</code>
        <button class="uw-btn uw-btn-primary" id="copy-receive-address" ${addressForNetwork(activeWallet,defaultNetwork.id)?"":"disabled"}>Copy address</button>
      </div>
      <div class="uw-warning"><b>Network matching is critical.</b><span>Bitcoin must be sent to the Bitcoin address, Solana to the Solana address, and EVM assets to the matching EVM chain. Sending on the wrong network can permanently lose funds.</span></div>
      <p class="uw-form-hint">Your public address can be shared. Never share the recovery phrase or private keys.</p>
    </div>`);
  bindBack("dashboard");
  const update=()=>{
    const network=NETWORKS.find(n=>n.id===$("receive-network").value)||NETWORKS[0];
    const address=addressForNetwork(activeWallet,network.id);
    $("receive-asset-name").textContent=network.name+" address";
    $("receive-address").textContent=address||"Not available for this import";
    $("copy-receive-address").disabled=!address;
  };
  $("receive-network").onchange=update;
  $("copy-receive-address").onclick=async()=>{
    const network=NETWORKS.find(n=>n.id===$("receive-network").value)||NETWORKS[0];
    const address=addressForNetwork(activeWallet,network.id);
    if(!address)return;
    try{await navigator.clipboard.writeText(address);$("copy-receive-address").textContent="Address copied";}
    catch{$("copy-receive-address").textContent="Copy unavailable";}
  };
}

function renderActivity() {
  const network=NETWORKS.find(n=>n.id===activeChainId)||NETWORKS[0];
  pageShell(`
    <div class="uw-flow-page">
      <header class="uw-flow-header">${backButton("dashboard")}<span class="uw-step-label">ON-CHAIN HISTORY</span></header>
      <h1>Activity</h1>
      <p class="uw-subtitle">Transactions are fetched from the selected mainnet's public data source.</p>
      <label class="uw-network-label" for="activity-network">NETWORK</label>
      <select class="uw-network-picker" id="activity-network">${NETWORKS.map(n=>`<option value="${n.id}" ${n.id===network.id?"selected":""}>${esc(n.name)}</option>`).join("")}</select>
      <div id="activity-list" class="uw-activity-list"><div class="uw-activity-empty"><span>◷</span><b>Loading on-chain history</b><small>Reading public network data…</small></div></div>
      <p class="uw-form-hint">Ethereum, Polygon and BNB standard JSON-RPC endpoints do not provide address-indexed history. Use the chain explorer for full indexed history.</p>
    </div>`);
  bindBack("dashboard");
  const load=()=>{
    activeChainId=$("activity-network").value;
    const state=networkStates[activeChainId];
    const list=$("activity-list");
    if(!list)return;
    if(!state){
      list.innerHTML='<div class="uw-activity-empty"><b>Network data not loaded</b><small>Return to Home and refresh the network list.</small></div>';
      return;
    }
    if(!state.online){
      list.innerHTML=`<div class="uw-activity-empty"><b>Unable to load history</b><small>${esc(state.error||"Provider unavailable")}</small></div>`;
      return;
    }
    if(!Array.isArray(state.history)){
      const net=NETWORKS.find(n=>n.id===activeChainId);
      list.innerHTML=`<div class="uw-activity-empty"><b>History indexer not connected</b><small>${esc(state.historyNote||"This RPC provides balances and chain status only.")}</small><a href="${net.explorer}" target="_blank" rel="noopener noreferrer">Open ${esc(net.name)} explorer</a></div>`;
      return;
    }
    if(!state.history.length){
      list.innerHTML='<div class="uw-activity-empty"><b>No transactions found</b><small>No transactions were returned for this public address.</small></div>';
      return;
    }
    list.innerHTML=state.history.map((tx,i)=>`
      <article class="uw-history-row">
        <div><b>${tx.failed?"Failed":tx.confirmed?"Confirmed":"Pending"}</b><small>${esc(short(tx.id))} · ${tx.timestamp?new Date(tx.timestamp*1000).toLocaleString():"time unavailable"}</small></div>
        <div class="uw-history-actions"><button data-check-tx="${i}">Verify</button><a href="${tx.explorerUrl}" target="_blank" rel="noopener noreferrer">Explorer</a></div>
        <p class="uw-history-result" id="tx-check-${i}"></p>
      </article>`).join("");
    list.querySelectorAll("[data-check-tx]").forEach(button=>button.onclick=async()=>{
      const tx=state.history[Number(button.dataset.checkTx)];
      const output=$("tx-check-"+button.dataset.checkTx);
      button.disabled=true;button.textContent="Checking…";
      try{
        const verified=await verifyTransactionStatus(activeChainId,tx.id);
        output.textContent=verified.failed?"On-chain execution failed.":verified.confirmed?"Confirmed by network.":verified.included?"Included; awaiting stronger confirmation.":"Not found or still pending.";
      }catch(err){output.textContent="Verification unavailable: "+err.message;}
      button.disabled=false;button.textContent="Verify";
    });
  };
  $("activity-network").onchange=load;
  load();
}

function renderExplore() {
  pageShell(`
    <div class="uw-flow-page">
      <header class="uw-flow-header">${backButton("dashboard")}<span class="uw-step-label">SUPPORTED MAINNETS</span></header>
      <h1>Explore networks</h1>
      <p class="uw-subtitle">UNITED is initialized with five independent mainnets. Each uses its own address format, transaction rules and explorer.</p>
      <div class="uw-explore-network-list">${NETWORKS.map(n=>`
        <article class="uw-explore-network">
          <b>${esc(n.name)}</b><span>${n.symbol} · ${n.family==="evm"?"EVM-compatible network":n.family==="utxo"?"Bitcoin UTXO network":"Solana account-based network"}</span>
          <a href="${n.explorer}" target="_blank" rel="noopener noreferrer">Open block explorer ↗</a>
        </article>`).join("")}</div>
    </div>`);
  bindBack("dashboard");
}

function renderSettings() {
  pageShell(`
    <div class="uw-flow-page">
      <header class="uw-flow-header">${backButton("dashboard")}<span class="uw-step-label">PREFERENCES & SECURITY</span></header>
      <h1>Settings</h1><p class="uw-subtitle">Manage your wallet and account preferences.</p>
      <div class="uw-settings-list">
        <div class="uw-setting"><div><b>Google account</b><small>Optional account link. Wallet keys stay on this device.</small></div><button id="google-connect">Connect</button></div>
        <div class="uw-setting"><div><b>Wallet name</b><small>${esc(activeWallet?.name||"United Wallet")}</small></div><button id="rename-wallet">Edit</button></div>
        <div class="uw-setting"><div><b>Recovery backup</b><small>Review your recovery phrase securely.</small></div><button id="backup-action">View</button></div>
        <div class="uw-setting"><div><b>Encrypted backup</b><small>Download a copy of this device vault.</small></div><button id="export-wallet">Download</button></div>
        <div class="uw-setting"><div><b>Lock wallet</b><small>Lock this wallet on this device.</small></div><button id="lock-wallet">Lock</button></div>
        <div class="uw-setting"><div><b>Remove wallet</b><small>Remove encrypted wallet data from this device.</small></div><button id="delete-wallet" class="uw-danger">Remove</button></div>
      </div>
    </div>`);
  bindBack("dashboard");
  $("google-connect").textContent=window.unitedAccountConnected?"Connected":"Connect";
  $("google-connect").onclick=()=>window.dispatchEvent(new Event("united-google-connect"));
  window.addEventListener("united-account-state",e=>{const button=$("google-connect");if(button)button.textContent=e.detail.connected?"Connected":"Connect";});
  $("rename-wallet").onclick=()=>{const n=prompt("New wallet name",activeWallet.name);if(n?.trim()){activeWallet.name=n.trim();saveVault(unlockedPassword).then(renderSettings);}};
  $("backup-action").onclick=backupFlow;
  $("export-wallet").onclick=()=>downloadBackup();
  $("lock-wallet").onclick=()=>{activeWallet=null;unlockedPassword=null;renderVaultUnlock();};
  $("delete-wallet").onclick=()=>confirmRemoveWallet();
}
function backupFlow() {
  const secret=secretOf(activeWallet);
  const kind=activeWallet.secretType||"mnemonic";
  const label=kind==="privateKey"?"Private key":"Recovery phrase";
  pageShell(`
    <div class="uw-flow-page">
      <header class="uw-flow-header">${backButton("settings")}<span class="uw-step-label">SENSITIVE WALLET DATA</span></header>
      <h1>${label}</h1><div class="uw-warning"><b>Keep this secret private.</b><span>Anyone who sees it can take control of your wallet.</span></div>
      <button class="uw-btn uw-btn-glass" id="reveal-secret">Reveal ${label.toLowerCase()}</button>
      <div id="secret-value" class="uw-secret-hidden">Hidden for your protection</div>
    </div>`);
  bindBack("settings");
  $("reveal-secret").onclick=()=>{$("secret-value").textContent=secret;$("secret-value").classList.add("visible");$("reveal-secret").disabled=true;};
}
function downloadBackup() {
  try{
    const raw=localStorage.getItem(KEY);
    const blob=new Blob([JSON.stringify({format:"UNITED encrypted wallet backup",version:1,backup:JSON.parse(raw||"null")},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="united-wallet-backup.json";a.click();URL.revokeObjectURL(url);
  }catch(err){showInfo("Backup failed",err.message);}
}
function confirmRemoveWallet() {
  if(!confirm("Remove this wallet from this device? This does not affect any on-chain funds or transactions. Make sure you have safely backed up the recovery phrase or private key."))return;
  wallets=wallets.filter(w=>w.id!==activeWalletId);activeWallet=wallets[0]||null;activeWalletId=activeWallet?.id||null;
  if(wallets.length){saveVault(unlockedPassword).then(renderDashboard);}
  else{localStorage.removeItem(KEY);unlockedPassword=null;renderHome();}
}
function showInfo(title,message) {
  const root=$("wallet-modal"),heading=$("wallet-modal-title"),body=$("wallet-modal-body");
  if(!root||!heading||!body)return;
  heading.textContent=title;body.innerHTML=`<p class="wallet-muted">${message}</p><button class="wallet-primary" id="info-close">Close</button>`;
  root.hidden=false;$("info-close").onclick=()=>root.hidden=true;
}
function renderVaultUnlock() {
  pageShell(`
    <div class="uw-flow-page uw-unlock-page">
      <header class="uw-flow-header">${backButton("home")}<span class="uw-step-label">ENCRYPTED LOCAL VAULT</span></header>
      <div class="uw-unlock-logo">${logoMark(70)}</div><h1>Unlock your wallet</h1><p class="uw-subtitle">Enter your wallet password to unlock the encrypted vault on this device.</p>
      <form class="uw-form" id="unlock-form"><label for="vault-password">Wallet password</label><input id="vault-password" type="password" autocomplete="current-password" required minlength="10"><button class="uw-btn uw-btn-primary">Unlock wallet <b>›</b></button><p id="wallet-inline-error" class="uw-inline-error" hidden></p></form>
    </div>`);
  bindBack("home");
  $("unlock-form").onsubmit=async e=>{
    e.preventDefault();
    try{
      wallets=await loadVault($("vault-password").value);
      if(!wallets.length)throw new Error("No wallet found in this backup.");
      unlockedPassword=$("vault-password").value;
      activeWallet=wallets.find(w=>w.id===activeWalletId)||wallets[0];
      activeWalletId=activeWallet.id;
      if(activeWallet.secretType==="mnemonic"&&!activeWallet.chainAccounts){
        activeWallet.chainAccounts=await deriveMultiChainAccounts(secretOf(activeWallet),activeWallet.address);
        await saveVault(unlockedPassword);
      }
      renderDashboard();
    }catch(err){
      $("wallet-inline-error").textContent=err.message||"Incorrect password or damaged local vault.";
      $("wallet-inline-error").hidden=false;
    }
  };
}
function renderDashboardIfUnlocked(){if(activeWallet)renderDashboard();else if(localStorage.getItem(KEY))renderVaultUnlock();else renderHome();}
export function mountUnitedWallet(user={uid:"device"}) {
  currentUser=user;
  // Wallets are device-local. Optional Google auth never moves private keys to cloud storage.
  KEY="united.wallet.v1.device";
  // Migrate a single legacy account-scoped encrypted vault to the device-local wallet slot.
  if(!localStorage.getItem(KEY)){
    const legacyKeys=Object.keys(localStorage).filter(k=>k.startsWith("united.wallet.v1.")&&k!=="united.wallet.v1.device");
    if(legacyKeys.length===1)localStorage.setItem(KEY,localStorage.getItem(legacyKeys[0]));
  }
  const raw=localStorage.getItem(KEY);
  if(raw){try{const meta=JSON.parse(raw);activeWalletId=meta.activeWalletId||activeWalletId;}catch{}}
  wallets=[];activeWallet=null;unlockedPassword=null;
  if(!document.querySelector(".united-wallet-app"))renderHome();
  else if(!localStorage.getItem(KEY))renderHome();
  else renderVaultUnlock();
}
