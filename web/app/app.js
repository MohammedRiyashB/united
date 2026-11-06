import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence,
  onAuthStateChanged, GoogleAuthProvider, GithubAuthProvider,
  signInWithPopup, signInAnonymously, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getDatabase, ref, set, onDisconnect
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

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
const db = getFirestore(app);
const realtimeDb = getDatabase(app);
const $ = (id) => document.getElementById(id);
const status = $("status");
let activePresenceRef = null;

const showError = (error) => {
  const messages = {
    "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication settings.",
    "auth/popup-blocked": "The sign-in popup was blocked. Allow popups and try again.",
    "auth/account-exists-with-different-credential": "An account already exists with another sign-in method. Sign in using that method.",
    "permission-denied": "Firebase denied this operation. Check the deployed Firestore and Realtime Database rules."
  };
  status.textContent = messages[error.code] || error.message || "The operation failed. Please try again.";
};

async function syncAccountData(user) {
  const profileRef = doc(db, "users", user.uid);
  const profileSnapshot = await getDoc(profileRef);
  const displayName = typeof user.displayName === "string"
    ? user.displayName.slice(0, 80)
    : null;

  if (!profileSnapshot.exists()) {
    const profile = { createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    if (displayName) profile.displayName = displayName;
    await setDoc(profileRef, profile);
  } else {
    const updates = { updatedAt: serverTimestamp() };
    if (displayName) updates.displayName = displayName;
    await setDoc(profileRef, updates, { merge: true });
  }

  activePresenceRef = ref(realtimeDb, `presence/${user.uid}`);
  await onDisconnect(activePresenceRef).set({ online: false });
  await set(activePresenceRef, { online: true });
}

async function clearPresence() {
  if (!activePresenceRef) return;
  const currentRef = activePresenceRef;
  activePresenceRef = null;
  try {
    await set(currentRef, { online: false });
    await onDisconnect(currentRef).cancel();
  } catch (error) {
    console.warn("Could not clear realtime presence:", error);
  }
}

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
  try {
    await clearPresence();
    await signOut(auth);
  } catch (e) { showError(e); }
});

onAuthStateChanged(auth, async (user) => {
  $("auth-panel").classList.toggle("hidden", !!user);
  $("account-panel").classList.toggle("hidden", !user);
  if (!user) {
    await clearPresence();
    return;
  }

  $("identity").textContent = user.isAnonymous
    ? "Guest session · " + user.uid
    : (user.email || user.displayName || user.uid);

  status.textContent = "Securing your account session…";
  try {
    await syncAccountData(user);
    status.textContent = "";
  } catch (error) {
    showError(error);
  }
});
