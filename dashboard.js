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

  loadDashboard(user.uid);
});

/* --------------------------------------------------
   LOAD DASHBOARD DATA
-------------------------------------------------- */
async function loadDashboard(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    document.getElementById("credits").textContent = snap.data().credits || 0;
  }
}

/* --------------------------------------------------
   LOGOUT
-------------------------------------------------- */
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
});
