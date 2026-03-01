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
   AUTH CHECK
-------------------------------------------------- */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  loadUserStats(user.uid);
  checkAdmin(user.uid);
  setupReferralLink(user.uid);
});

/* --------------------------------------------------
   LOAD USER STATS
-------------------------------------------------- */
async function loadUserStats(uid) {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data();

    document.getElementById("creditsDisplay").textContent = data.credits || 0;
    document.getElementById("statSitesSurf").textContent = data.sitesSurf || 0;
    document.getElementById("statCreditsEarned").textContent = data.creditsEarned || 0;
    document.getElementById("statTimeSurf").textContent = (data.timeSurf || 0) + "s";
    document.getElementById("statStreak").textContent = data.streak || 0;
    document.getElementById("statHumanChecks").textContent = data.humanChecks || 0;

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
