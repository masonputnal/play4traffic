/* --------------------------------------------------
   FIREBASE SETUP
-------------------------------------------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  increment
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

const statusEl = document.getElementById("status");
const cooldownEl = document.getElementById("cooldownTimer");
const progressBar = document.getElementById("progressBar");

let uid = null;
let earningInterval = null;
let progressInterval = null;

const EARN_INTERVAL = 20000; // 20 seconds
const SESSION_LENGTH = 30 * 60 * 1000; // 30 minutes
const COOLDOWN_LENGTH = 30 * 60 * 1000; // 30 minutes

/* --------------------------------------------------
   AUTH CHECK
-------------------------------------------------- */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  uid = user.uid;
  await initEarningState();
});

/* --------------------------------------------------
   INITIALIZE EARNING STATE
-------------------------------------------------- */
async function initEarningState() {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  let data = snap.data() || {};

  const now = Date.now();
  const sessionStart = data.gameSessionStart || 0;
  const cooldownEnd = data.gameCooldownEnd || 0;

  if (now < cooldownEnd) {
    startCooldown(cooldownEnd);
    return;
  }

  if (now - sessionStart < SESSION_LENGTH) {
    startEarning(sessionStart);
  } else {
    const newStart = Date.now();
    await updateDoc(ref, { gameSessionStart: newStart });
    startEarning(newStart);
  }
}

/* --------------------------------------------------
   START EARNING + PROGRESS BAR
-------------------------------------------------- */
function startEarning(sessionStart) {
  statusEl.textContent = "Earning credits…";

  let progress = 0;
  progressBar.style.width = "0%";

  // Progress bar animation
  progressInterval = setInterval(() => {
    if (document.hidden) return;

    progress += 100 / (EARN_INTERVAL / 200); // update every 200ms
    if (progress >= 100) progress = 100;

    progressBar.style.width = progress + "%";
  }, 200);

  // Credit earning loop
  earningInterval = setInterval(async () => {
    if (document.hidden) return;

    const now = Date.now();
    if (now - sessionStart >= SESSION_LENGTH) {
      await beginCooldown();
      return;
    }

    try {
      await updateDoc(doc(db, "users", uid), {
        credits: increment(1)
      });
      statusEl.textContent = "Earned +1 credit!";
    } catch (e) {
      statusEl.textContent = "Error awarding credits.";
    }

    progress = 0;
    progressBar.style.width = "0%";

  }, EARN_INTERVAL);
}

/* --------------------------------------------------
   BEGIN COOLDOWN
-------------------------------------------------- */
async function beginCooldown() {
  clearInterval(earningInterval);
  clearInterval(progressInterval);

  const cooldownEnd = Date.now() + COOLDOWN_LENGTH;

  await updateDoc(doc(db, "users", uid), {
    gameCooldownEnd: cooldownEnd
  });

  startCooldown(cooldownEnd);
}

/* --------------------------------------------------
   COOLDOWN TIMER
-------------------------------------------------- */
function startCooldown(cooldownEnd) {
  statusEl.textContent = "Cooldown active — you cannot earn right now.";
  progressBar.style.width = "0%";

  const timer = setInterval(() => {
    const now = Date.now();
    const remaining = cooldownEnd - now;

    if (remaining <= 0) {
      clearInterval(timer);
      window.location.reload();
      return;
    }

    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);

    cooldownEl.textContent = `Cooldown: ${mins}m ${secs}s remaining`;
  }, 1000);
}

/* --------------------------------------------------
   LOGOUT
-------------------------------------------------- */
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
});
