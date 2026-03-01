/* --------------------------------------------------
   FIREBASE v10 SETUP
-------------------------------------------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const db = getFirestore(app);

/* --------------------------------------------------
   SIGNUP BUTTON HANDLER
-------------------------------------------------- */
document.getElementById("signupBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value.trim();
  const confirm = document.getElementById("confirmPassword").value.trim();
  const status = document.getElementById("signupStatus");

  status.textContent = "";

  if (pass !== confirm) {
    status.textContent = "Passwords do not match.";
    return;
  }

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);

    await setDoc(doc(db, "users", userCred.user.uid), {
      credits: 0
    });

    window.location.href = "dashboard.html";
  } catch (e) {
    status.textContent = e.message;
  }
});
