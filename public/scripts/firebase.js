// --------------------------------------------------
// Play4Traffic - Firebase Initialization (v10+)
// Clean, modular, single initialization
// --------------------------------------------------

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// --------------------------------------------------
// Firebase Config
// (Your actual config stays here — unchanged)
// --------------------------------------------------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// --------------------------------------------------
// Initialize App (Safe Singleton)
// --------------------------------------------------
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// --------------------------------------------------
// Export Core Services
// --------------------------------------------------
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --------------------------------------------------
// Optional Helper Functions (Clean + Reusable)
// --------------------------------------------------

// Get a user document reference
export function userRef(uid) {
  return doc(db, "users", uid);
}

// Get a Roblox game promotion reference
export function gameRef(uid) {
  return doc(db, "games", uid);
}

// Get a site reference
export function siteRef(id) {
  return doc(db, "sites", id);
}

// Safely update credits
export async function addCredits(uid, amount) {
  const ref = userRef(uid);
  await updateDoc(ref, { credits: increment(amount) });
}

// Fetch user data
export async function getUserData(uid) {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? snap.data() : null;
}
