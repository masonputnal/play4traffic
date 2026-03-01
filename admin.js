// ---------------------------------------------------------
// Play4Traffic Admin Script (2026 Edition)
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
  getFirestore
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
// Admin Emails
// ---------------------------------------------------------
const ADMIN_EMAILS = [
  "farmermason1842@gmail.com",
  "crazyplantlady1842@gmail.com"
];


// ---------------------------------------------------------
// UI Elements
// ---------------------------------------------------------
const logoutBtn = document.getElementById("logoutBtn");

const tabs = {
  tabSites: "panelSites",
  tabVideos: "panelVideos",
  tabRoblox: "panelRoblox",
  tabUsers: "panelUsers",
  tabReports: "panelReports"
};


// ---------------------------------------------------------
// Tab Switching
// ---------------------------------------------------------
function switchTab(tabId, panelId) {
  document.querySelectorAll(".admin-tab").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".admin-panel").forEach(panel => panel.style.display = "none");

  document.getElementById(tabId).classList.add("active");
  document.getElementById(panelId).style.display = "block";
}

Object.keys(tabs).forEach(tabId => {
  document.getElementById(tabId).addEventListener("click", () => {
    switchTab(tabId, tabs[tabId]);
  });
});

// Default tab
switchTab("tabSites", "panelSites");


// ---------------------------------------------------------
// Logout
// ---------------------------------------------------------
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
});


// ---------------------------------------------------------
// Loop‑Safe Auth Listener
// ---------------------------------------------------------
onAuthStateChanged(auth, (user) => {
  // If Firebase is initialized and no user exists → redirect
  if (!user && auth.currentUser === null) {
    window.location.href = "login.html";
    return;
  }

  // If user exists and Firebase is fully initialized
  if (user && auth.currentUser) {
    const isAdmin = ADMIN_EMAILS.includes(user.email);

    if (!isAdmin) {
      alert("Admin access only.");
      window.location.href = "dashboard.html";
      return;
    }

    console.log("Admin access granted:", user.email);
  }
});

