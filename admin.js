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
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
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

  document.getElementById("adminPanel").style.display = "block";
  loadAllData();
});

/* --------------------------------------------------
   LOAD ALL DATA
-------------------------------------------------- */
async function loadAllData() {
  loadUsers();
  loadSites();
  loadVideos();
}

/* --------------------------------------------------
   USERS
-------------------------------------------------- */
async function loadUsers() {
  const list = document.getElementById("usersList");
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "users"));
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const li = document.createElement("li");
    li.textContent = `${docSnap.id} — Credits: ${data.credits || 0}`;
    list.appendChild(li);
  });
}

/* --------------------------------------------------
   SITES
-------------------------------------------------- */
async function loadSites() {
  const list = document.getElementById("sitesList");
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "sites"));
  snap.forEach((docSnap) => {
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
   VIDEOS
-------------------------------------------------- */
async function loadVideos() {
  const list = document.getElementById("videosList");
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "videos"));
  snap.forEach((docSnap) => {
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
   ADD SITE
-------------------------------------------------- */
document.getElementById("addSiteForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const url = document.getElementById("newSiteUrl").value.trim();
  const ownerUid = document.getElementById("newSiteOwner").value.trim();

  if (!url || !ownerUid) return;

  const id = crypto.randomUUID();
  await setDoc(doc(db, "sites", id), {
    url,
    ownerUid
  });

  document.getElementById("newSiteUrl").value = "";
  document.getElementById("newSiteOwner").value = "";
  loadSites();
});

/* --------------------------------------------------
   ADD VIDEO
-------------------------------------------------- */
document.getElementById("addVideoForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const url = document.getElementById("newVideoUrl").value.trim();
  const ownerUid = document.getElementById("newVideoOwner").value.trim();

  if (!url || !ownerUid) return;

  const id = crypto.randomUUID();
  await setDoc(doc(db, "videos", id), {
    url,
    ownerUid
  });

  document.getElementById("newVideoUrl").value = "";
  document.getElementById("newVideoOwner").value = "";
  loadVideos();
});
