// surf.js — Firestore-driven surf engine with anti-spam, anti-multi-tab, and session locking

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  collection,
  query,
  where,
  getDocs,
  limit,
  onSnapshot,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// -------------------------
// FIREBASE CONFIG
// -------------------------
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

// -------------------------
// DOM ELEMENTS
// -------------------------
const currentUrlEl = document.getElementById("currentUrl");
const timeLeftEl = document.getElementById("timeLeft");
const earnedCreditsEl = document.getElementById("earnedCredits");
const startSurfBtn = document.getElementById("startSurfBtn");
const nextSiteBtn = document.getElementById("nextSiteBtn");

// Buy buttons (unchanged)
const buy100Btn = document.getElementById("buy100");
const buy220Btn = document.getElementById("buy220");
const buy600Btn = document.getElementById("buy600");
const buy1300Btn = document.getElementById("buy1300");
const buy2800Btn = document.getElementById("buy2800");
const buyCreditsBtnTop = document.getElementById("buyCreditsBtnTop");

// -------------------------
// SURF CONFIG
// -------------------------
const CREDITS_PER_SESSION = 1;

// -------------------------
// STATE
// -------------------------
let uid = null;
let isSurfing = false;
let surfTimer = null;
let timeLeft = 0;
let currentSessionDocRef = null;
let activeSessionUnsub = null;

let PROMOTIONS = [];   // <-- NEW: unified list of sites/videos/games
let promoIndex = -1;

// -------------------------
// UI HELPERS
// -------------------------
function disableStartButton() {
  startSurfBtn.disabled = true;
  startSurfBtn.style.opacity = "0.5";
  startSurfBtn.style.pointerEvents = "none";
}

function enableStartButton() {
  startSurfBtn.disabled = false;
  startSurfBtn.style.opacity = "1";
  startSurfBtn.style.pointerEvents = "auto";
}

function setSurfingState(active) {
  isSurfing = active;
  if (active) disableStartButton();
  else enableStartButton();
}

// -------------------------
// LOAD PROMOTIONS (NEW)
// -------------------------
async function loadPromotions() {
  PROMOTIONS = [];

  const collections = ["sites", "videos", "games"];

  for (const col of collections) {
    const q = query(
      collection(db, col),
      where("active", "==", true),
      where("creditsRemaining", ">", 0)
    );

    const snap = await getDocs(q);
    snap.forEach(docSnap => {
      const data = docSnap.data();
      PROMOTIONS.push({
        id: docSnap.id,
        col,
        url: data.url,
        duration: data.duration || 10,
        creditsRemaining: data.creditsRemaining
      });
    });
  }

  return PROMOTIONS;
}

// -------------------------
// SESSION HELPERS
// -------------------------
function makeSessionId() {
  return crypto.randomUUID ? crypto.randomUUID() : "sess_" + Date.now();
}

async function createSurfSession() {
  const q = query(
    collection(db, "surfSessions"),
    where("uid", "==", uid),
    where("status", "==", "active"),
    limit(1)
  );

  const snap = await getDocs(q);
  if (!snap.empty) throw new Error("Active session already exists");

  const sessionId = makeSessionId();
  const sessionRef = doc(db, "surfSessions", `${uid}_${sessionId}`);

  await setDoc(sessionRef, {
    uid,
    sessionId,
    status: "active",
    startedAt: serverTimestamp(),
    completedAt: null,
    creditsAwarded: 0
  });

  currentSessionDocRef = sessionRef;
}

async function completeSurfSession() {
  if (!currentSessionDocRef) return;

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(currentSessionDocRef);
      if (!snap.exists()) throw new Error("Session missing");

      const data = snap.data();
      if (data.status !== "active") throw new Error("Session already completed");

      tx.update(currentSessionDocRef, {
        status: "completed",
        completedAt: serverTimestamp(),
        creditsAwarded: CREDITS_PER_SESSION
      });

      const userRef = doc(db, "users", uid);
      tx.set(userRef, { credits: increment(CREDITS_PER_SESSION) }, { merge: true });
    });

    const currentCredits = parseInt(earnedCreditsEl.textContent || "0", 10);
    earnedCreditsEl.textContent = currentCredits + CREDITS_PER_SESSION;
  } catch (err) {
    console.error(err);
  }

  currentSessionDocRef = null;
}

// -------------------------
// MULTI-TAB PROTECTION
// -------------------------
function watchActiveSessionForUser(userId) {
  if (activeSessionUnsub) activeSessionUnsub();

  const q = query(
    collection(db, "surfSessions"),
    where("uid", "==", userId),
    where("status", "==", "active"),
    limit(1)
  );

  activeSessionUnsub = onSnapshot(q, (snap) => {
    if (!snap.empty) {
      setSurfingState(true);
      currentSessionDocRef = snap.docs[0].ref;
    } else {
      setSurfingState(false);
      currentSessionDocRef = null;
    }
  });
}

// -------------------------
// SURF FLOW (NEW)
// -------------------------
function getNextPromotion() {
  if (PROMOTIONS.length === 0) return null;
  promoIndex = (promoIndex + 1) % PROMOTIONS.length;
  return PROMOTIONS[promoIndex];
}

function openPromotion(url) {
  currentUrlEl.textContent = url;
  window.open(url, "_blank", "noopener");
}

async function startSurfingFlow() {
  if (!uid) return alert("You must be logged in.");
  if (isSurfing) return;

  await loadPromotions();
  if (PROMOTIONS.length === 0) {
    currentUrlEl.textContent = "No active promotions available.";
    return;
  }

  try {
    setSurfingState(true);
    await createSurfSession();

    const promo = getNextPromotion();
    openPromotion(promo.url);

    timeLeft = promo.duration;
    timeLeftEl.textContent = timeLeft;

    if (surfTimer) clearInterval(surfTimer);

    surfTimer = setInterval(async () => {
      timeLeft--;
      timeLeftEl.textContent = timeLeft;

      if (timeLeft <= 0) {
        clearInterval(surfTimer);
        surfTimer = null;

        await deductPromotionCredit(promo);
        await completeSurfSession();

        setSurfingState(false);
        currentUrlEl.textContent = "Session complete.";
      }
    }, 1000);
  } catch (err) {
    console.error(err);
    setSurfingState(false);
    currentUrlEl.textContent = "Unable to start session.";
  }
}

// -------------------------
// DEDUCT PROMOTION CREDIT (NEW)
// -------------------------
async function deductPromotionCredit(promo) {
  const ref = doc(db, promo.col, promo.id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const remaining = data.creditsRemaining - 1;

  await updateDoc(ref, {
    creditsRemaining: remaining,
    active: remaining > 0
  });
}

// -------------------------
// STRIPE CHECKOUT (unchanged)
// -------------------------
async function createCheckout(priceId) {
  if (!uid) return alert("You must be logged in.");

  const res = await fetch("/.netlify/functions/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId, uid })
  });

  const data = await res.json();
  if (data.url) window.location.href = data.url;
}

// -------------------------
// EVENT LISTENERS
// -------------------------
startSurfBtn.addEventListener("click", () => {
  if (!isSurfing) startSurfingFlow();
});

nextSiteBtn.addEventListener("click", () => {
  const promo = getNextPromotion();
  if (promo) openPromotion(promo.url);
});

// Stripe buttons (unchanged)
if (buy100Btn) buy100Btn.onclick = () => createCheckout("price_1T4YZPQeHhafnMhGqcJZsjs8");
if (buy220Btn) buy220Btn.onclick = () => createCheckout("price_1T4YlNQeHhafnMhGuZxTm8SO");
if (buy600Btn) buy600Btn.onclick = () => createCheckout("price_1T4YzvQeHhafnMhGp9yzzM4O");
if (buy1300Btn) buy1300Btn.onclick = () => createCheckout("price_1T4Z3sQeHhafnMhGbTgBYywg");
if (buy2800Btn) buy2800Btn.onclick = () => createCheckout("price_1T4Z7fQeHhafnMhGu5sJj5z4");
if (buyCreditsBtnTop) buyCreditsBtnTop.onclick = () => createCheckout("price_1T4YZPQeHhafnMhGqcJZsjs8");

// -------------------------
// AUTH
// -------------------------
onAuthStateChanged(auth, (user) => {
  if (!user) {
    uid = null;
    setSurfingState(false);
    currentUrlEl.textContent = "Log in to start surfing.";
    return;
  }

  uid = user.uid;
  currentUrlEl.textContent = "Press Start to begin surfing.";
  watchActiveSessionForUser(uid);
});
