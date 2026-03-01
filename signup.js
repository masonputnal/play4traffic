// ---------------------------------------------------------
// Play4Traffic Signup Script (2026 Edition)
// ---------------------------------------------------------

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


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
const db = getFirestore(app);


// ---------------------------------------------------------
// UI Elements
// ---------------------------------------------------------
const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const confirmEl = document.getElementById("confirmPassword");
const signupBtn = document.getElementById("signupBtn");
const signupStatus = document.getElementById("signupStatus");


// ---------------------------------------------------------
// Referral Tracking
// ---------------------------------------------------------
function getReferral() {
  const params = new URLSearchParams(window.location.search);
  return params.get("ref") || null;
}


// ---------------------------------------------------------
// Signup Handler
// ---------------------------------------------------------
signupBtn.addEventListener("click", async () => {
  signupStatus.textContent = "";

  const email = emailEl.value.trim();
  const password = passEl.value.trim();
  const confirm = confirmEl.value.trim();

  if (!email || !password || !confirm) {
    signupStatus.textContent = "Please fill out all fields.";
    return;
  }

  if (password !== confirm) {
    signupStatus.textContent = "Passwords do not match.";
    return;
  }

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    const referralBy = getReferral();

    // Create Firestore user document
    await setDoc(doc(db, "users", uid), {
      email: email,
      credits: 0,
      sitesSurf: 0,
      creditsEarned: 0,
      timeSurf: 0,
      streak: 0,
      humanChecksPassed: 0,
      referralBy: referralBy || null,
      createdAt: serverTimestamp()
    });

    signupStatus.textContent = "Account created! Redirecting...";

  } catch (err) {
    signupStatus.textContent = err.message;
  }
});


// ---------------------------------------------------------
// Redirect After Signup
// ---------------------------------------------------------
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "dashboard.html";
  }
});

