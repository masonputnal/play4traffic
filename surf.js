// --- Firebase Setup ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCdVQD50oh4U2J6vDlgluOXrzerGyaxiV8",
  authDomain: "play4traffic.firebaseapp.com",
  projectId: "play4traffic",
  storageBucket: "play4traffic.firebasestorage.app",
  messagingSenderId: "82841843986",
  appId: "1:82841843986:web:beb2ae3944b10ba3521bcb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- UI Elements ---
const statusText = document.getElementById("statusText");
const countdownNumber = document.getElementById("countdownNumber");
const progressBar = document.getElementById("progressBar");
const messageText = document.getElementById("messageText");
const nextSiteBtn = document.getElementById("nextSiteBtn");
const buyCreditsBtn = document.getElementById("buyCreditsBtn");

// --- Surf Engine State ---
let currentDocRef = null;
let timer = null;
let duration = 0;

// --- Minimum Duration Rules ---
function enforceMinimum(url, rawDuration) {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return Math.max(rawDuration, 20);
  }
  if (url.includes("roblox.com/games")) {
    return Math.max(rawDuration, 30);
  }
  return Math.max(rawDuration, 10);
}

// --- Fetch Next Item (Sites → Videos → Games) ---
async function getNextItem() {
  const collections = ["sites", "videos", "games"];

  for (const colName of collections) {
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);

    const items = snap.docs
      .map(d => ({ id: d.id, ref: d.ref, ...d.data() }))
      .filter(d => d.active && d.creditsLeft > 0)
      .sort((a, b) => a.order - b.order);

    if (items.length > 0) return items[0];
  }

  return null;
}

// --- Start Surf Cycle ---
async function startSurf() {
  const item = await getNextItem();

  if (!item) {
    statusText.textContent = "No active promotions available.";
    countdownNumber.textContent = "0";
    progressBar.style.width = "0%";
    nextSiteBtn.style.display = "none";
    return;
  }

  currentDocRef = item.ref;

  const rawDuration = item.duration || 10;
  duration = enforceMinimum(item.url, rawDuration);

  statusText.textContent = item.title || "Surfing…";
  countdownNumber.textContent = duration;
  messageText.textContent = "Opened in a new tab…";

  window.open(item.url, "_blank");

  nextSiteBtn.style.display = "none";
  progressBar.style.transition = "none";
  progressBar.style.width = "100%";

  setTimeout(() => {
    progressBar.style.transition = `width ${duration}s linear`;
    progressBar.style.width = "0%";
  }, 50);

  runTimer();
}

// --- Timer Logic ---
function runTimer() {
  let timeLeft = duration;
  countdownNumber.textContent = timeLeft;

  timer = setInterval(async () => {
    timeLeft--;
    countdownNumber.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      nextSiteBtn.style.display = "inline-block";

      await updateDoc(currentDocRef, {
        creditsLeft: Math.max(0, (await currentDocRef.get()).data().creditsLeft - 1),
        active: (await currentDocRef.get()).data().creditsLeft - 1 > 0
      });
    }
  }, 1000);
}

// --- Next Site Button ---
nextSiteBtn.addEventListener("click", () => {
  startSurf();
});

// --- Buy Credits Button ---
buyCreditsBtn.addEventListener("click", () => {
  window.location.href = "/buy-credits";
});

// --- Auth Gate ---
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "/login";
    return;
  }
  startSurf();
});
