// ---------------------------------------------------------
// Play4Traffic Reset Password Script (2026 Edition)
// ---------------------------------------------------------

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getAuth,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


// ---------------------------------------------------------
// Firebase Config (YOUR REAL CONFIG)
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


// ---------------------------------------------------------
// UI Elements
// ---------------------------------------------------------
const emailEl = document.getElementById("email");
const resetBtn = document.getElementById("resetBtn");
const resetStatus = document.getElementById("resetStatus");


// ---------------------------------------------------------
// Reset Password Handler
// ---------------------------------------------------------
resetBtn.addEventListener("click", async () => {
  resetStatus.textContent = "";

  const email = emailEl.value.trim();

  if (!email) {
    resetStatus.textContent = "Please enter your email.";
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    resetStatus.textContent = "Password reset link sent! Check your inbox.";
  } catch (err) {
    resetStatus.textContent = err.message;
  }
});
