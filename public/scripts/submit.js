// /scripts/submit.js
import { auth, db } from "./firebase.js";
import {
    doc, setDoc, updateDoc, getDoc, increment, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const urlInput = document.getElementById("videoUrl");
const creditsInput = document.getElementById("creditsToSpend");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submitBtn");

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "/login.html";
    currentUser = user;
});

submitBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    const credits = Number(creditsInput.value);

    if (!url || credits <= 0) {
        statusEl.textContent = "Enter a valid URL and credits.";
        return;
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
        statusEl.textContent = "Invalid YouTube URL.";
        return;
    }

    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists() || userSnap.data().credits < credits) {
        statusEl.textContent = "Not enough credits.";
        return;
    }

    await updateDoc(userRef, {
        credits: increment(-credits)
    });

    const videoRef = doc(db, "videos", videoId);
    await setDoc(videoRef, {
        url,
        videoId,
        title: "",
        duration: 9999,
        submittedBy: currentUser.uid,
        creditsPool: credits,
        reports: 0,
        active: true,
        createdAt: serverTimestamp()
    });

    statusEl.textContent = "Video submitted and credits added!";
    urlInput.value = "";
    creditsInput.value = "";
});

function extractYouTubeId(url) {
    try {
        const u = new URL(url);
        if (u.hostname === "youtu.be") return u.pathname.slice(1);
        if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
        return null;
    } catch {
        return null;
    }
}
