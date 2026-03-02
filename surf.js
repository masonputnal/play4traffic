import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  query,
  where,
  getDocs
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

const iframe = document.getElementById("surfFrame");
const statusEl = document.getElementById("surfStatus");
const timerEl = document.getElementById("surfTimer");

let currentUser = null;
let currentLink = null;
let countdownInterval = null;

const VIEW_TIME = 15000; // 15s per view, adjust as needed

const perViewCosts = {
  site: 1,
  youtube: 2,
  roblox: 3
};

const perViewRewards = {
  site: 1,
  youtube: 2,
  roblox: 3
};

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  await loadNextLink();
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  signOut(auth);
});

async function loadNextLink() {
  clearInterval(countdownInterval);
  statusEl.textContent = "Loading next site…";
  timerEl.textContent = "";

  const q = query(
    collection(db, "promotedLinks"),
    where("active", "==", true)
  );
  const snap = await getDocs(q);

  const candidates = [];
  snap.forEach(docSnap => {
    const d = docSnap.data();
    if (d.credits > 0) {
      candidates.push({ id: docSnap.id, ...d });
    }
  });

  if (candidates.length === 0) {
    statusEl.textContent = "No active promotions available right now.";
    iframe.src = "about:blank";
    return;
  }

  currentLink = candidates[Math.floor(Math.random() * candidates.length)];
  iframe.src = currentLink.url;
  statusEl.textContent = "Viewing promoted link…";

  startCountdown();
}

function startCountdown() {
  let remaining = VIEW_TIME / 1000;
  timerEl.textContent = `Time left: ${remaining}s`;

  countdownInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      handleViewComplete();
    } else {
      timerEl.textContent = `Time left: ${remaining}s`;
    }
  }, 1000);
}

async function handleViewComplete() {
  if (!currentLink || !currentUser) {
    await loadNextLink();
    return;
  }

  const type = currentLink.type;
  const cost = perViewCosts[type] || 1;
  const reward = perViewRewards[type] || 1;

  try {
    // reward surfer
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
      credits: increment(reward),
      sitesSurf: increment(1),
      creditsEarned: increment(reward),
      timeSurf: increment(VIEW_TIME / 1000)
    });

    // deduct from owner
    const ownerRef = doc(db, "users", currentLink.owner);
    const ownerSnap = await getDoc(ownerRef);
    const ownerData = ownerSnap.data() || {};
    const ownerCredits = ownerData.credits || 0;
    const newOwnerCredits = Math.max(0, ownerCredits - cost);

    await updateDoc(ownerRef, {
      credits: newOwnerCredits
    });

    // update link credits
    const linkRef = doc(db, "promotedLinks", currentLink.id);
    const newLinkCredits = Math.max(0, currentLink.credits - cost);
    const linkUpdate = { credits: newLinkCredits };
    if (newLinkCredits <= 0) {
      linkUpdate.active = false;
    }
    await updateDoc(linkRef, linkUpdate);

    statusEl.textContent = `Earned +${reward} credits!`;
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error processing view.";
  }

  setTimeout(() => {
    loadNextLink();
  }, 1000);
}
