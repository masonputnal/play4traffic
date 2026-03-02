/* --------------------------------------------------
   FIREBASE v10 SETUP
-------------------------------------------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AI" + "zaSyCdVQD50oh4U2J6vDlgluOXrzerGyaxiV8",
  authDomain: "play4traffic.firebaseapp.com",
  projectId: "play4traffic",
  storageBucket: "play4traffic.firebasestorage.app",
  messagingSenderId: "82841843986",
  appId: "1:82841843986:web:beb2ae3944b10ba3521bcb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* --------------------------------------------------
   DOM ELEMENTS
-------------------------------------------------- */
const creditsEl = document.getElementById("creditsDisplay");
const sitesSurfEl = document.getElementById("statSitesSurf");
const creditsEarnedEl = document.getElementById("statCreditsEarned");
const timeSurfEl = document.getElementById("statTimeSurf");
const streakEl = document.getElementById("statStreak");
const humanChecksEl = document.getElementById("statHumanChecks");

/* --------------------------------------------------
   AUTH CHECK
-------------------------------------------------- */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  await loadUserStats(user.uid);
  setupReferralLink(user.uid);
  checkAdmin(user.uid);
});

/* --------------------------------------------------
   LOAD USER STATS (LIVE)
-------------------------------------------------- */
async function loadUserStats(uid) {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const d = snap.data();

    creditsEl.textContent = d.credits ?? 0;
    sitesSurfEl.textContent = d.sitesSurf ?? 0;
    creditsEarnedEl.textContent = d.creditsEarned ?? 0;
    timeSurfEl.textContent = (d.timeSurf ?? 0) + "s";
    streakEl.textContent = d.streak ?? 0;
    humanChecksEl.textContent = d.humanChecks ?? 0;

  } catch (e) {
    console.warn("Error loading dashboard stats:", e);
  }
}

/* --------------------------------------------------
   REFERRAL LINK
-------------------------------------------------- */
function setupReferralLink(uid) {
  const link = `${window.location.origin}/signup.html?ref=${uid}`;
  const input = document.getElementById("referralLink");
  const copyBtn = document.getElementById("copyReferralBtn");
  const status = document.getElementById("copyStatus");

  input.value = link;

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(link);
      status.textContent = "Copied!";
      setTimeout(() => (status.textContent = ""), 2000);
    } catch {
      status.textContent = "Copy failed.";
    }
  });
}

/* --------------------------------------------------
   ADMIN CHECK
-------------------------------------------------- */
async function checkAdmin(uid) {
  try {
    const ref = doc(db, "admin", uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      document.getElementById("adminLink").style.display = "inline-block";
    }
  } catch (e) {
    console.warn("Admin check failed:", e);
  }
}

/* --------------------------------------------------
   LOGOUT
-------------------------------------------------- */
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
});
