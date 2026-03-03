import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
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

let currentUser = null;
let currentSessionId = null;
let currentLink = null;
let surfTimer = null;

const iframe = document.getElementById("surfFrame");
const startBtn = document.getElementById("startSurfingBtn");
const nextBtn = document.getElementById("nextBtn");
const timerEl = document.getElementById("timer");
const creditsEl = document.getElementById("creditsDisplay");
const earnedEl = document.getElementById("earnedCredits");
const currentUrlEl = document.getElementById("currentUrl");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  await loadUserCredits();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
});

async function loadUserCredits() {
  const ref = doc(db, "users", currentUser.uid);
  const snap = await getDoc(ref);
  const data = snap.data() || {};
  creditsEl.textContent = data.credits || 0;
}

startBtn.addEventListener("click", async () => {
  await startSurfSession();
  await loadNextLink();
});

nextBtn.addEventListener("click", async () => {
  await loadNextLink();
});

async function startSurfSession() {
  const session = {
    uid: currentUser.uid,
    status: "active",
    startedAt: serverTimestamp()
  };

  const ref = await addDoc(collection(db, "surfSessions"), session);
  currentSessionId = ref.id;
}

async function loadNextLink() {
  clearInterval(surfTimer);
  timerEl.textContent = "0s";

  const link = await getRandomActivePromotion();
  if (!link) {
    iframe.src = "about:blank";
    currentUrlEl.textContent = "No active promotions available.";
    return;
  }

  currentLink = link;
  currentUrlEl.textContent = link.url;
  iframe.src = link.url;

  startCountdown(link.duration, async () => {
    await awardUserCredit();
    await deductPromotionCredit(link);
    await loadUserCredits();
  });
}

async function getRandomActivePromotion() {
  const collections = ["sites", "videos", "games"];
  const all = [];

  for (const col of collections) {
    const q = query(
      collection(db, col),
      where("active", "==", true),
      where("creditsRemaining", ">", 0)
    );
    const snap = await getDocs(q);
    snap.forEach(docSnap => {
      all.push({ id: docSnap.id, col, ...docSnap.data() });
    });
  }

  if (all.length === 0) return null;

  return all[Math.floor(Math.random() * all.length)];
}

function startCountdown(seconds, onComplete) {
  let remaining = seconds;
  timerEl.textContent = `${remaining}s`;

  surfTimer = setInterval(() => {
    remaining--;
    timerEl.textContent = `${remaining}s`;

    if (remaining <= 0) {
      clearInterval(surfTimer);
      onComplete();
      earnedEl.textContent = parseInt(earnedEl.textContent) + 1;
    }
  }, 1000);
}

async function awardUserCredit() {
  const ref = doc(db, "users", currentUser.uid);
  const snap = await getDoc(ref);
  const data = snap.data() || {};
  const newCredits = (data.credits || 0) + 1;

  await updateDoc(ref, { credits: newCredits });
}

async function deductPromotionCredit(link) {
  const ref = doc(db, link.col, link.id);
  const snap = await getDoc(ref);
  const data = snap.data();

  if (!data) return;

  const remaining = data.creditsRemaining - 1;

  await updateDoc(ref, {
    creditsRemaining: remaining,
    active: remaining > 0
  });
}
