/* --------------------------------------------------
   FIREBASE SETUP
-------------------------------------------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc
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
   ADMIN CHECK
-------------------------------------------------- */
async function checkAdmin(uid) {
  const ref = doc(db, "admin", uid);
  const snap = await getDoc(ref);
  return snap.exists();
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const isAdmin = await checkAdmin(user.uid);
  if (!isAdmin) {
    alert("You are not an admin.");
    window.location.href = "dashboard.html";
    return;
  }

  // Load all admin data
  loadSites();
  loadVideos();
  loadRoblox();
  loadUsers();
  loadReports();

  // Auto-open Sites tab
  document.getElementById("panelSites").style.display = "block";
});

/* --------------------------------------------------
   TAB SWITCHING
-------------------------------------------------- */
const tabs = {
  tabSites: "panelSites",
  tabVideos: "panelVideos",
  tabRoblox: "panelRoblox",
  tabUsers: "panelUsers",
  tabReports: "panelReports"
};

Object.keys(tabs).forEach(tabId => {
  const btn = document.getElementById(tabId);
  if (!btn) return;

  btn.addEventListener("click", () => {
    Object.values(tabs).forEach(panel => {
      document.getElementById(panel).style.display = "none";
    });

    document.getElementById(tabs[tabId]).style.display = "block";
  });
});

/* --------------------------------------------------
   LOAD SITES
-------------------------------------------------- */
async function loadSites() {
  const list = document.getElementById("sitesList");
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "sites"));
  snap.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${data.url}</strong><br>
      Owner: ${data.ownerUid}<br>
      <button data-id="${docSnap.id}" class="deleteSite">Delete</button>
    `;

    list.appendChild(li);
  });

  document.querySelectorAll(".deleteSite").forEach(btn => {
    btn.addEventListener("click", async () => {
      await deleteDoc(doc(db, "sites", btn.dataset.id));
      loadSites();
    });
  });
}

/* --------------------------------------------------
   ADD SITE
-------------------------------------------------- */
document.getElementById("addSiteForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const url = document.getElementById("newSiteUrl").value.trim();
  const ownerUid = document.getElementById("newSiteOwner").value.trim();

  const id = crypto.randomUUID();
  await setDoc(doc(db, "sites", id), { url, ownerUid });

  e.target.reset();
  loadSites();
});

/* --------------------------------------------------
   LOAD VIDEOS
-------------------------------------------------- */
async function loadVideos() {
  const list = document.getElementById("videosList");
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "videos"));
  snap.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${data.url}</strong><br>
      Owner: ${data.ownerUid}<br>
      <button data-id="${docSnap.id}" class="deleteVideo">Delete</button>
    `;

    list.appendChild(li);
  });

  document.querySelectorAll(".deleteVideo").forEach(btn => {
    btn.addEventListener("click", async () => {
      await deleteDoc(doc(db, "videos", btn.dataset.id));
      loadVideos();
    });
  });
}

/* --------------------------------------------------
   ADD VIDEO
-------------------------------------------------- */
document.getElementById("addVideoForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const url = document.getElementById("newVideoUrl").value.trim();
  const ownerUid = document.getElementById("newVideoOwner").value.trim();

  const id = crypto.randomUUID();
  await setDoc(doc(db, "videos", id), { url, ownerUid });

  e.target.reset();
  loadVideos();
});

/* --------------------------------------------------
   LOAD ROBLOX
-------------------------------------------------- */
async function loadRoblox() {
  const list = document.getElementById("robloxList");
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "games"));
  snap.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${data.url}</strong><br>
      Owner: ${data.ownerUid}<br>
      <button data-id="${docSnap.id}" class="deleteRoblox">Delete</button>
    `;

    list.appendChild(li);
  });

  document.querySelectorAll(".deleteRoblox").forEach(btn => {
    btn.addEventListener("click", async () => {
      await deleteDoc(doc(db, "games", btn.dataset.id));
      loadRoblox();
    });
  });
}

/* --------------------------------------------------
   ADD ROBLOX GAME
-------------------------------------------------- */
document.getElementById("addRobloxForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const url = document.getElementById("newRobloxUrl").value.trim();
  const ownerUid = document.getElementById("newRobloxOwner").value.trim();

  const id = crypto.randomUUID();
  await setDoc(doc(db, "games", id), { url, ownerUid });

  e.target.reset();
  loadRoblox();
});

/* --------------------------------------------------
   LOAD USERS
-------------------------------------------------- */
async function loadUsers() {
  const list = document.getElementById("usersList");
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "users"));
  snap.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement("li");
    li.textContent = `${docSnap.id} — Credits: ${data.credits || 0}`;
    list.appendChild(li);
  });
}

/* --------------------------------------------------
   GIVE CREDITS
-------------------------------------------------- */
document.getElementById("giveCreditsForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const uid = document.getElementById("creditUserUid").value.trim();
  const amount = parseInt(document.getElementById("creditAmount").value.trim());

  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { credits: amount });

  e.target.reset();
  loadUsers();
});

/* --------------------------------------------------
   LOAD REPORTS
-------------------------------------------------- */
async function loadReports() {
  const list = document.getElementById("reportsList");
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "reports"));
  snap.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${data.url}</strong><br>
      Reason: ${data.reason}<br>
      <button data-id="${docSnap.id}" class="deleteReport">Delete Report</button>
    `;

    list.appendChild(li);
  });

  document.querySelectorAll(".deleteReport").forEach(btn => {
    btn.addEventListener("click", async () => {
      await deleteDoc(doc(db, "reports", btn.dataset.id));
      loadReports();
    });
  });
}

/* --------------------------------------------------
   LOGOUT
-------------------------------------------------- */
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
