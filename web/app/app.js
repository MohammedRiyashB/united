import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence,
  onAuthStateChanged, GoogleAuthProvider, GithubAuthProvider,
  signInWithPopup, signInAnonymously, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBerQPGoHd8EkLuZqhVmWPBQFtfxOYangk",
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
const status = $("status");
const showError = (error) => {
  const messages = {
    "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication settings.",
    "auth/popup-blocked": "The sign-in popup was blocked. Allow popups and try again.",
    "auth/account-exists-with-different-credential": "An account already exists with another sign-in method. Sign in using that method."
  };
  status.textContent = messages[error.code] || error.message || "Sign-in failed. Please try again.";
};

try {
  await setPersistence(auth, browserLocalPersistence);
} catch (error) {
  showError(error);
}

$("google").addEventListener("click", async () => {
  status.textContent = "Opening Google sign-in…";
  try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (e) { showError(e); }
});
$("github").addEventListener("click", async () => {
  status.textContent = "Opening GitHub sign-in…";
  try { await signInWithPopup(auth, new GithubAuthProvider()); } catch (e) { showError(e); }
});
$("guest").addEventListener("click", async () => {
  status.textContent = "Creating guest session…";
  try { await signInAnonymously(auth); } catch (e) { showError(e); }
});
$("email-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "Signing in…";
  try {
    await signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
  } catch (e) { showError(e); }
});
$("signup").addEventListener("click", async () => {
  status.textContent = "Creating your account…";
  try {
    await createUserWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
  } catch (e) { showError(e); }
});
$("logout").addEventListener("click", async () => {
  try { await signOut(auth); } catch (e) { showError(e); }
});

onAuthStateChanged(auth, (user) => {
  $("auth-panel").classList.toggle("hidden", !!user);
  $("account-panel").classList.toggle("hidden", !user);
  if (user) {
    $("identity").textContent = user.isAnonymous
      ? "Guest session · " + user.uid
      : (user.email || user.displayName || user.uid);
    status.textContent = "";
  }
});