import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  getRedirectResult,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithRedirect,
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
    "auth/api-key-not-valid": "Firebase rejected the web API key. This is a project/API-key configuration response, not a password error. The website is sending the configured key.",
    "auth/invalid-api-key": "The configured Firebase API key is invalid or unavailable for this project.",
    "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication.",
    "auth/operation-not-allowed": "This sign-in provider is disabled in Firebase Authentication.",
    "auth/popup-blocked": "The browser blocked the sign-in window. Try again or allow pop-ups.",
    "auth/account-exists-with-different-credential": "An account already exists with another sign-in method. Use that method to sign in.",
    "auth/email-already-in-use": "An account already exists for this email address. Choose Sign in instead.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Choose a stronger password with at least 6 characters.",
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/network-request-failed": "Network request failed. Check your connection and try again.",
    "auth/too-many-requests": "Too many attempts. Wait a little before trying again."
  };
  return messages[error?.code] || error?.message || "Authentication failed. Please try again.";
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
  $("password").autocomplete = signup ? "new-password" : "current-password";
  $("forgot-password").hidden = signup;
  setStatus("");
}

$("mode-toggle").addEventListener("click", () => {
  setMode(authMode === "signin" ? "signup" : "signin");
});

$("google").addEventListener("click", () => runAuth("Redirecting to Google…", async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithRedirect(auth, provider);
}));

$("github").addEventListener("click", () => runAuth("Redirecting to GitHub…", async () => {
  await signInWithRedirect(auth, new GithubAuthProvider());
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

async function initializeAuth() {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult?.user) {
      setStatus("Sign-in completed successfully.", "success");
    }
  } catch (error) {
    console.error("UNITED auth initialization error:", error);
    setStatus(explainAuthError(error), "error");
  }
}

onAuthStateChanged(auth, (user) => {
  $("auth-view").hidden = Boolean(user);
  $("account-view").hidden = !user;
  if (user) {
    const identity = user.isAnonymous
      ? "Guest account · " + user.uid
      : (user.email || user.displayName || user.uid);
    $("account-identity").textContent = identity;
    $("account-provider").textContent = user.isAnonymous ? "Anonymous session" : "Verified Firebase session";
    setStatus("");
  }
});

initializeAuth();
