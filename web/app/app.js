import { mountUnitedWallet } from "./wallet.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

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
const authReady = setPersistence(auth, browserLocalPersistence);

// The wallet loads instantly and remains device-local, regardless of Google auth state.
mountUnitedWallet({ uid: "device" });
document.getElementById("auth-view")?.setAttribute("hidden", "");
document.getElementById("account-view")?.removeAttribute("hidden");

window.addEventListener("united-google-connect", async () => {
  try {
    await authReady;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
    window.dispatchEvent(new Event("united-google-connected"));
  } catch (error) {
    console.error("UNITED Google connection error:", error);
    const friendly = error?.code === "auth/popup-closed-by-user"
      ? "Google sign-in was closed before it finished."
      : error?.code === "auth/unauthorized-domain"
        ? "This domain is not authorized for Google sign-in in Firebase."
        : (error?.message || "Google sign-in failed.");
    window.dispatchEvent(new CustomEvent("united-google-error", { detail: { message: friendly } }));
    alert(friendly);
  }
});

// Do not remount or lock the active wallet when Google auth state changes.
// Google identity and the local encrypted wallet are separate by design.
onAuthStateChanged(auth, (user) => {
  window.dispatchEvent(new CustomEvent("united-account-state", {
    detail: { connected: Boolean(user), email: user?.email || null }
  }));
});

authReady.catch(error => console.error("UNITED Firebase persistence initialization error:", error));
