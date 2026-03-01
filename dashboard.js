// ---------------------------------------------------------
// Play4Traffic Dashboard Script (2026 Edition)
// ---------------------------------------------------------

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// ---------------------------------------------------------
// Firebase Init (YOUR REAL CONFIG)
// ---------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCdVQD50oh4U2J6vDlgluOXrzerGyaxiV8",
  authDomain: "play4traffic.firebaseapp.com",
  projectId: "play4traffic",
  storageBucket: "play4traffic.firebasestorage.app",
  messagingSenderId: "82841843986",
  appId: "1:82841843986:web:beb2ae3944b10ba3521bcb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ---------------------------------------------------------
// UI Elements
// ---------------------------------------------------------
const creditsDisplay = document.getElementById("creditsDisplay");
const statSitesSurf = document.getElementById("statSitesSurf");
const statCreditsEarned = document.getElementById("statCreditsEarned");
const statTimeSurf = document.getElementById("statTimeSurf");
const statStreak = document.getElementById("statStreak");
const statHumanChecks = document.getElementById("statHumanChecks");

const referralLinkInput = document.getElementById("referralLink");
const copyReferralBtn = document.getElementById("copyReferralBtn");
const copyStatus = document.getElementById("copyStatus");

const adminLink = document.getElementById("adminLink");
const logoutBtn = document.getElementById("logoutBtn");


// ---------------------------------------------------------
// Admin Emails
// ---------------------------------------------------------
const adminEmails = [
  "farmermason1842@gmail.com",
  "crazyplantlady1842@gmail.com"
];


// ---------------------------------------------------------
// Load User Stats
// ---------------------------------------------------------
async function loadUserStats(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) return;

    const data = snap.data();

    creditsDisplay.textContent = data.credits ?? 0;
    statSitesSurf.textContent = data.sitesSurf ?? 0;
    statCreditsEarned.textContent = data.creditsEarned ?? 0;
    statTimeSurf.textContent = data.timeSurf ?? 0;
    statStreak.textContent = data.streak ?? 0;
    statHumanChecks.textContent = data.humanChecksPassed ?? 0;

    referralLinkInput.value = `${window.location.origin}/signup.html?ref=${uid}`;

  } catch (err) {
    console.error("Error loading stats:", err);
  }
}


// ---------------------------------------------------------
// Copy Referral Link
// ---------------------------------------------------------
copyReferralBtn.addEventListener("click", () => {
  referralLinkInput.select();
  navigator.clipboard.writeText(referralLinkInput.value);

  copyStatus.textContent = "Copied!";
  setTimeout(() => (copyStatus.textContent = ""), 2000);
});


// ---------------------------------------------------------
// Logout
// ---------------------------------------------------------
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
});


// ---------------------------------------------------------
// Auth Listener (LOOP‑SAFE VERSION)
// ---------------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  // If Firebase is initialized and no user exists → redirect
  if (!user && auth.currentUser === null) {
    window.location.href = "login.html";
    return;
  }

  // If user exists and Firebase is fully initialized → load dashboard
  if (user && auth.currentUser) {

    if (adminEmails.includes(user.email)) {
      adminLink.style.display = "inline-block";
    }

    await loadUserStats(user.uid);
  }
});
