import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginStatus = document.getElementById("loginStatus");

loginBtn.addEventListener("click", async () => {
  loginStatus.textContent = "";

  const email = emailEl.value.trim();
  const password = passEl.value.trim();

  if (!email || !password) {
    loginStatus.textContent = "Please enter email and password.";
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ⭐ REQUIRED: Save UID so surf.js can load credits
    localStorage.setItem("uid", user.uid);

    loginStatus.textContent = "Logging in...";
  } catch (err) {
    loginStatus.textContent = err.message;
  }
});

onAuthStateChanged(auth, (user) => {
  if (user && auth.currentUser) {
    window.location.href = "dashboard.html";
  }
});

