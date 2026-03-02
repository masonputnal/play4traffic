// --- Firebase Setup ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, updateDoc, getDoc
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
const currentUrl = document.getElementById("currentUrl");
const startSurfBtn = document.getElementById("startSurfBtn");
const nextSiteBtn = document.getElementById("nextSiteBtn");
const timeLeftEl = document.getElementById("timeLeft");
const earnedCreditsEl = document.getElementById("earnedCredits");

// Stripe buttons
const buy100 = document.getElementById("buy100");
const buy220 = document.getElementById("buy220");
const buy600 = document.getElementById("buy600");
const buy1300 = document.getElementById("buy1300");
const buy2800 = document.getElementById("buy2800");
const buyCreditsBtnTop = document.getElementById("buyCreditsBtnTop");

// --- Surf Engine State ---
let currentDocRef = null;
let timer = null;
let duration = 0;
let earned = 0;

// --- Minimum Duration Rules ---
function enforceMinimum(url, rawDuration) {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return Math.max(rawDuration, 20);
  if (url.includes("roblox.com/games")) return Math.max(rawDuration, 30);
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
    currentUrl.textContent = "No active promotions.";
    return;
  }

  currentDocRef = item.ref;
  currentUrl.textContent = item.url;

  const rawDuration = item.duration || 10;
  duration = enforceMinimum(item.url, rawDuration);

  timeLeftEl.textContent = duration;
  nextSiteBtn.style.display = "none";

  window.open(item.url, "_blank");

  runTimer();
}

// --- Timer Logic ---
function runTimer() {
  let timeLeft = duration;
  timeLeftEl.textContent = timeLeft;

  timer = setInterval(async () => {
    timeLeft--;
    timeLeftEl.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      nextSiteBtn.style.display = "inline-block";

      const snap = await getDoc(currentDocRef);
      const data = snap.data();

      const newCredits = Math.max(0, data.creditsLeft - 1);

      await updateDoc(currentDocRef, {
        creditsLeft: newCredits,
        active: newCredits > 0
      });

      earned++;
      earnedCreditsEl.textContent = earned;
    }
  }, 1000);
}

// --- Next Site Button ---
nextSiteBtn.addEventListener("click", startSurf);

// --- Start Surf Button ---
startSurfBtn.addEventListener("click", startSurf);

// --- Stripe Checkout ---
async function startCheckout(priceId) {
  const user = auth.currentUser;
  if (!user) return;

  const res = await fetch("/.netlify/functions/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId, uid: user.uid })
  });

  const data = await res.json();
  window.location.href = data.url;
}

buy100.onclick = () => startCheckout("price_1T4YZPQeHhafnMhGqcJZsjs8");
buy220.onclick = () => startCheckout("price_1T4YlNQeHhafnMhGuZxTm8SO");
buy600.onclick = () => startCheckout("price_1T4YzvQeHhafnMhGp9yzzM4O");
buy1300.onclick = () => startCheckout("price_1T4Z3sQeHhafnMhGbTgBYywg");
buy2800.onclick = () => startCheckout("price_1T4Z7fQeHhafnMhGu5sJj5z4");
buyCreditsBtnTop.onclick = () => startCheckout("price_1T4YZPQeHhafnMhGqcJZsjs8");

// --- Auth Gate ---
onAuthStateChanged(auth, user => {
  if (!user) window.location.href = "/login";
});


