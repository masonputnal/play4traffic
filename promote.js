import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
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

const tabs = document.querySelectorAll(".promote-tab");
const urlInput = document.getElementById("urlInput");
const urlLabel = document.getElementById("urlLabel");
const costNote = document.getElementById("costNote");
const form = document.getElementById("promoteForm");
const formMessage = document.getElementById("formMessage");
const userCreditsEl = document.getElementById("userCredits");
const activeList = document.getElementById("activeList");
const depletedList = document.getElementById("depletedList");
const typeWarning = document.getElementById("typeWarning");

let currentType = "site";
let currentUser = null;
let currentCredits = 0;

const activationCosts = {
  site: 100,
  youtube: 200,
  roblox: 1000
};

const perViewCosts = {
  site: 1,
  youtube: 2,
  roblox: 3
};

/* --------------------------------------------------
   URL VALIDATION (UI ONLY)
-------------------------------------------------- */
function validateUrlForType(url, type) {
  if (type === "site") {
    return (
      url.startsWith("http") &&
      !url.includes("youtube.com") &&
      !url.includes("youtu.be") &&
      !url.includes("roblox.com/games")
    );
  }

  if (type === "youtube") {
    return (
      url.includes("youtube.com") ||
      url.includes("youtu.be")
    );
  }

  if (type === "roblox") {
    return url.includes("roblox.com/games");
  }

  return false;
}

/* --------------------------------------------------
   AUTH
-------------------------------------------------- */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  await loadUserCredits();
  await loadPromotions();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
});

/* --------------------------------------------------
   TAB SWITCHING
-------------------------------------------------- */
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentType = tab.dataset.type;
    updateFormForType();
  });
});

function updateFormForType() {
  if (currentType === "site") {
    urlLabel.textContent = "Website URL";
    urlInput.placeholder = "https://example.com";
    typeWarning.textContent = "Only normal websites allowed. No YouTube or Roblox links.";
  } else if (currentType === "youtube") {
    urlLabel.textContent = "YouTube Video URL";
    urlInput.placeholder = "https://www.youtube.com/watch?v=...";
    typeWarning.textContent = "Only YouTube links allowed.";
  } else {
    urlLabel.textContent = "Roblox Game URL";
    urlInput.placeholder = "https://www.roblox.com/games/...";
    typeWarning.textContent = "Only Roblox game links allowed.";
  }

  const cost = activationCosts[currentType];
  costNote.textContent =
    `Activation cost: ${cost} credits. This also becomes your starting credits for this link.`;

  formMessage.textContent = "";
}

/* --------------------------------------------------
   LOAD USER CREDITS
-------------------------------------------------- */
async function loadUserCredits() {
  const ref = doc(db, "users", currentUser.uid);
  const snap = await getDoc(ref);
  const data = snap.data() || {};
  currentCredits = data.credits || 0;
  userCreditsEl.textContent = `Credits: ${currentCredits}`;
}

/* --------------------------------------------------
   SUBMIT PROMOTION (UI VALIDATION ADDED)
-------------------------------------------------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "";

  const url = urlInput.value.trim();

  if (!validateUrlForType(url, currentType)) {
    formMessage.textContent = `This URL does not match the selected type (${currentType}).`;
    return;
  }

  const cost = activationCosts[currentType];
  if (currentCredits < cost) {
    formMessage.textContent = "Not enough credits to activate this promotion.";
    return;
  }

  try {
    // Deduct credits
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
      credits: (currentCredits - cost)
    });
    currentCredits -= cost;
    userCreditsEl.textContent = `Credits: ${currentCredits}`;

    // Add promotion
    await addDoc(collection(db, "promotedLinks"), {
      owner: currentUser.uid,
      type: currentType,
      url,
      credits: cost,
      active: true,
      createdAt: serverTimestamp()
    });

    urlInput.value = "";
    formMessage.textContent = "Promotion created successfully.";
    await loadPromotions();
  } catch (err) {
    console.error(err);
    formMessage.textContent = "Error creating promotion.";
  }
});

/* --------------------------------------------------
   LOAD PROMOTIONS
-------------------------------------------------- */
async function loadPromotions() {
  activeList.innerHTML = "";
  depletedList.innerHTML = "";

  const q = query(
    collection(db, "promotedLinks"),
    where("owner", "==", currentUser.uid)
  );
  const snap = await getDocs(q);

  const active = [];
  const depleted = [];

  snap.forEach(docSnap => {
    const d = docSnap.data();
    const item = { id: docSnap.id, ...d };
    if (item.active && item.credits > 0) {
      active.push(item);
    } else {
      depleted.push(item);
    }
  });

  active.forEach(item => renderPromoRow(item, activeList));
  depleted.forEach(item => renderPromoRow(item, depletedList));
}

/* --------------------------------------------------
   RENDER PROMO ROW
-------------------------------------------------- */
function renderPromoRow(item, container) {
  const row = document.createElement("div");
  row.className = "promo-row";

  const main = document.createElement("div");
  main.className = "promo-main";

  const icon = item.type === "site" ? "🌐" : item.type === "youtube" ? "▶️" : "🎮";

  const title = document.createElement("div");
  title.textContent = `${icon} ${item.type.toUpperCase()}`;

  const urlEl = document.createElement("div");
  urlEl.className = "promo-url";
  urlEl.textContent = item.url;

  const meta = document.createElement("div");
  meta.className = "promo-meta";
  meta.textContent = `Credits: ${item.credits}`;

  const status = document.createElement("span");
  status.className = "promo-status";
  if (item.active && item.credits > 0) {
    status.classList.add("active");
    status.textContent = "Active";
  } else if (!item.active && item.credits > 0) {
    status.classList.add("paused");
    status.textContent = "Paused";
  } else {
    status.classList.add("depleted");
    status.textContent = "Depleted";
  }

  meta.append(" • ");
  meta.appendChild(status);

  main.appendChild(title);
  main.appendChild(urlEl);
  main.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "promo-actions";

  if (item.active && item.credits > 0) {
    const pauseBtn = document.createElement("button");
    pauseBtn.textContent = "Pause";
    pauseBtn.addEventListener("click", () => updateActive(item.id, false));
    actions.appendChild(pauseBtn);
  } else if (!item.active && item.credits > 0) {
    const resumeBtn = document.createElement("button");
    resumeBtn.textContent = "Resume";
    resumeBtn.addEventListener("click", () => updateActive(item.id, true));
    actions.appendChild(resumeBtn);
  }

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", () => deletePromo(item.id));
  actions.appendChild(deleteBtn);

  row.appendChild(main);
  row.appendChild(actions);
  container.appendChild(row);
}

/* --------------------------------------------------
   UPDATE ACTIVE
-------------------------------------------------- */
async function updateActive(id, value) {
  try {
    await updateDoc(doc(db, "promotedLinks", id), { active: value });
    await loadPromotions();
  } catch (err) {
    console.error(err);
  }
}

/* --------------------------------------------------
   DELETE PROMO
-------------------------------------------------- */
async function deletePromo(id) {
  try {
    await updateDoc(doc(db, "promotedLinks", id), { active: false, credits: 0 });
    await loadPromotions();
  } catch (err) {
    console.error(err);
  }
}
