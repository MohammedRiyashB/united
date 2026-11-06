import { mountUnitedWallet } from "./wallet.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  linkWithPopup,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBerQPGoHd8EkLuZqhVmWpBQFtfxOYangk",
  authDomain: "unitedcryptonetwork.firebaseapp.com",
  databaseURL: "https://unitedcryptonetwork-default-rtdb.firebaseio.com",
  projectId: "unitedcryptonetwork",
  storageBucket: "unitedcryptonetwork.firebasestorage.app",
  messagingSenderId: "442569271893",
  appId: "1:442569271893:web:f54ae979f2057583c642dc",
  measurementId: "G-S2F9CE5YQ9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize persistence before any auth action can reference this promise.
const authReady = setPersistence(auth, browserLocalPersistence);
const $ = (id) => document.getElementById(id);

const statusBox = $("auth-status");
const statusText = $("status-text");
const submitButton = $("email-submit");
let authMode = "signin";

function setStatus(message, type = "info") {
  statusText.textContent = message;
  statusBox.dataset.type = type;
  statusBox.classList.toggle("visible", Boolean(message));
}

function explainAuthError(error) {
  const messages = {
    "auth/api-key-not-valid": "Firebase rejected the configured web API key. Email and guest authentication working means the key is being accepted for those requests; check the provider configuration and the exact error below.",
    "auth/invalid-api-key": "The configured Firebase API key is invalid or unavailable for this project.",
    "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication.",
    "auth/operation-not-allowed": "This sign-in provider is not enabled. Enable it in Firebase Authentication → Sign-in method.",
    "auth/popup-blocked": "The browser blocked the sign-in window. Allow pop-ups for this site and try again.",
    "auth/popup-closed-by-user": "The sign-in window was closed before authentication finished. Try again and complete the provider steps.",
    "auth/account-exists-with-different-credential": "An account already exists with this email using another sign-in method. Sign in with that method first.",
    "auth/credential-already-in-use": "This Google or GitHub account is already linked to another UNITED account. Sign in with that provider to access the existing account.",
    "auth/email-already-in-use": "An account already exists for this email address. Choose Sign in instead.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Choose a stronger password with at least 6 characters.",
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/network-request-failed": "Network request failed. Check your connection and try again.",
    "auth/too-many-requests": "Too many attempts. Wait a little before trying again."
  };
  const code = error?.code || "unknown";
  return (messages[code] || error?.message || "Authentication failed. Please try again.") +
    (code !== "unknown" ? " (" + code + ")" : "");
}

function setBusy(busy, label = "Please wait…") {
  document.querySelectorAll("[data-auth-action]").forEach((button) => {
    button.disabled = busy;
  });
  if (busy) {
    submitButton.textContent = label;
  } else {
    submitButton.textContent = authMode === "signup" ? "Create account" : "Sign in";
  }
}

async function runAuth(label, action) {
  setBusy(true, label);
  setStatus(label, "info");
  try {
    await authReady;
    await action();
  } catch (error) {
    console.error("UNITED authentication error:", error);
    setStatus(explainAuthError(error), "error");
  } finally {
    setBusy(false);
  }
}

function setMode(mode) {
  authMode = mode;
  const signup = mode === "signup";
  $("auth-title").textContent = signup ? "Create your UNITED ID." : "One account. Your network identity.";
  $("auth-subtitle").textContent = signup
    ? "Create an account to access the UNITED testnet."
    : "Sign in securely to access the UNITED testnet.";
  $("email-submit").textContent = signup ? "Create account" : "Sign in";
  $("mode-toggle").textContent = signup ? "Back to sign in" : "Create account";
  $("mode-prompt").textContent = signup ? "Already registered?" : "New to UNITED?";
  $("password").autocomplete = signup ? "new-password" : "current-password";
  $("forgot-password").hidden = signup;
  setStatus("");
}

async function authenticateWithProvider(provider) {
  const currentUser = auth.currentUser;

  // Upgrade an anonymous session when possible, preserving its Firebase UID.
  if (currentUser?.isAnonymous) {
    try {
      await linkWithPopup(currentUser, provider);
      return;
    } catch (error) {
      // If this provider already belongs to an existing account, sign in to it.
      if (error.code === "auth/credential-already-in-use") {
        await signInWithPopup(auth, provider);
        return;
      }
      throw error;
    }
  }

  await signInWithPopup(auth, provider);
}

$("mode-toggle").addEventListener("click", () => {
  setMode(authMode === "signin" ? "signup" : "signin");
});

$("google").addEventListener("click", () => runAuth("Opening Google sign-in…", async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await authenticateWithProvider(provider);
}));

$("github").addEventListener("click", () => runAuth("Opening GitHub sign-in…", async () => {
  const provider = new GithubAuthProvider();
  provider.addScope("user:email");
  await authenticateWithProvider(provider);
}));

$("guest").addEventListener("click", () => runAuth("Starting a guest session…", async () => {
  await signInAnonymously(auth);
}));

$("email-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = $("email").value.trim();
  const password = $("password").value;
  runAuth(authMode === "signup" ? "Creating your account…" : "Signing in…", async () => {
    if (authMode === "signup") {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  });
});

$("forgot-password").addEventListener("click", () => runAuth("Sending password reset email…", async () => {
  const email = $("email").value.trim();
  if (!email) throw new Error("Enter your email address first.");
  await sendPasswordResetEmail(auth, email);
  setStatus("Password reset email sent. Check your inbox.", "success");
}));

$("password-toggle").addEventListener("click", () => {
  const password = $("password");
  const visible = password.type === "text";
  password.type = visible ? "password" : "text";
  $("password-toggle").textContent = visible ? "Show" : "Hide";
});

$("logout").addEventListener("click", () => runAuth("Signing out…", async () => {
  await signOut(auth);
}));


window.addEventListener("united-google-connect", async () => {
  try {
    await authReady;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("UNITED Google connection error:", error);
    alert(explainAuthError(error));
  }
});

onAuthStateChanged(auth, (user) => {
  // Wallet creation is the home screen. Google sign-in is optional and lives in Settings.
  $("auth-view").hidden = true;
  $("account-view").hidden = false;
  if (user) {
    const deviceKey = "united.wallet.v1.device";
    const accountKey = "united.wallet.v1." + user.uid;
    if (!localStorage.getItem(accountKey) && localStorage.getItem(deviceKey)) {
      localStorage.setItem(accountKey, localStorage.getItem(deviceKey));
    }
    mountUnitedWallet(user);
  } else {
    mountUnitedWallet({ uid: "device" });
  }
});

authReady.catch((error) => {
  console.error("UNITED Firebase persistence initialization error:", error);
  setStatus(explainAuthError(error), "error");
});
