/* --------------------------------------------------
   FIREBASE v10 SETUP
-------------------------------------------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc
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
   ADMIN ACCESS CHECK
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

  // Admin verified → show panel
  document.getElementById("panelSites").style.display = "block";

  loadUsers();
  loadSites();
  loadVideos();
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
   USERS
-------------------------------------------------- */
async function loadUsers() {
  const list = document.getElementById("panelUsers");
  if (!list) return;

  const container = document.createElement("ul");
  container.id = "usersList";
  container.innerHTML = "";

  const snap = await getDocs(collection(db, "users"));
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const li = document.createElement("li");
    li.textContent = `${docSnap.id} — Credits: ${data.credits || 0}`;
    container.appendChild(li);
  });

  list.appendChild(container);
}

/* --------------------------------------------------
   SITES
-------------------------------------------------- */
async function loadSites() {
  const panel = document.getElementById("panelSites");
  if (!panel) return;

  // Clear old list
  const oldList = document.getElementById("sitesList");
  if (oldList) oldList.remove();

  const list = document.createElement("ul");
  list.id = "sitesList";

  const snap = await getDocs(collection(db, "sites"));
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${data.url}</strong><br>
      Owner: ${data.ownerUid || "Unknown"}<br>
      <button data-id="${docSnap.id}" class="deleteSite">Delete</button>
    `;

    list.appendChild(li);
  });

  panel.appendChild(list);

  document.querySelectorAll(".deleteSite").forEach(btn => {
    btn.addEventListener("click", async () => {
      await deleteDoc(doc(db, "sites", btn.dataset.id));
      loadSites();
    });
  });
}

/* --------------------------------------------------
   VIDEOS
-------------------------------------------------- */
async function loadVideos() {
  const panel = document.getElementById("panelVideos");
  if (!panel) return;

  const oldList = document.getElementById("videosList");
  if (oldList) oldList.remove();

  const list = document.createElement("ul");
  list.id = "videosList";

  const snap = await getDocs(collection(db, "videos"));
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${data.url}</strong><br>
      Owner: ${data.ownerUid || "Unknown"}<br>
      <button data-id="${docSnap.id}" class="deleteVideo">Delete</button>
    `;

    list.appendChild(li);
  });

  panel.appendChild(list);

  document.querySelectorAll(".deleteVideo").forEach(btn => {
    btn.addEventListener("click", async () => {
      await deleteDoc(doc(db, "videos", btn.dataset.id));
      loadVideos();
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
