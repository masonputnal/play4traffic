/* --------------------------------------------------
   FIREBASE v10 SETUP
-------------------------------------------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  sendPasswordResetEmail
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
const auth = getAuth(app);

/* --------------------------------------------------
   RESET PASSWORD BUTTON HANDLER
-------------------------------------------------- */
document.getElementById("resetBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const status = document.getElementById("resetStatus");

  status.textContent = "";

  try {
    await sendPasswordResetEmail(auth, email);
    status.textContent = "Password reset email sent!";
  } catch (e) {
    status.textContent = e.message;
  }
});
