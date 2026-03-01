// /scripts/watch.js
import { auth, db } from "./firebase.js";
import {
    doc, getDoc, updateDoc, increment,
    collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let currentUser = null;
let currentVideo = null;
let player = null;
let timer = null;

let watchedSeconds = 0;
let earnedCredits = 0;

const MAX_SECONDS = 120;
const REPORT_THRESHOLD = 3;

const titleEl = document.getElementById("videoTitle");
const watchedEl = document.getElementById("watched");
const earnedEl = document.getElementById("earned");
const poolEl = document.getElementById("pool");
const statusEl = document.getElementById("status");

onAuthStateChanged(auth, async (user) => {
    if (!user) window.location.href = "/login.html";
    currentUser = user;
    await loadVideo();
});

async function loadVideo() {
    stopTimer();
    watchedSeconds = 0;
    earnedCredits = 0;

    watchedEl.textContent = "0";
    earnedEl.textContent = "0";

    const videosRef = collection(db, "videos");
    const q = query(videosRef, where("active", "==", true));
    const snap = await getDocs(q);

    const docs = snap.docs;
    if (docs.length === 0) {
        titleEl.textContent = "No videos available.";
        return;
    }

    currentVideo = docs[Math.floor(Math.random() * docs.length)];
    const data = currentVideo.data();

    titleEl.textContent = data.title || "Untitled Video";
    poolEl.textContent = data.creditsPool;

    loadYouTubePlayer(data.videoId);
}

window.onYouTubeIframeAPIReady = function () {};

function loadYouTubePlayer(videoId) {
    if (player) {
        player.loadVideoById(videoId);
        return;
    }

    player = new YT.Player("player", {
        videoId,
        events: {
            onStateChange: onStateChange
        }
    });
}

function onStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) startTimer();
    else stopTimer();
}

function startTimer() {
    if (timer) return;

    timer = setInterval(async () => {
        watchedSeconds++;
        watchedEl.textContent = watchedSeconds;

        if (watchedSeconds % 10 === 0) {
            await awardCredit();
        }

        if (watchedSeconds >= MAX_SECONDS) {
            stopTimer();
            statusEl.textContent = "Max credits earned.";
        }

    }, 1000);
}

function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

async function awardCredit() {
    const videoRef = currentVideo.ref;
    const videoSnap = await getDoc(videoRef);
    const data = videoSnap.data();

    if (data.creditsPool <= 0) {
        statusEl.textContent = "Video ran out of credits.";
        stopTimer();
        return;
    }

    await updateDoc(videoRef, {
        creditsPool: increment(-1)
    });

    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
        credits: increment(1)
    });

    earnedCredits++;
    earnedEl.textContent = earnedCredits;
    poolEl.textContent = data.creditsPool - 1;
}

document.getElementById("nextBtn").addEventListener("click", loadVideo);

document.getElementById("reportBtn").addEventListener("click", async () => {
    const ref = currentVideo.ref;
    await updateDoc(ref, { reports: increment(1) });

    const snap = await getDoc(ref);
    const data = snap.data();

    if (data.reports >= REPORT_THRESHOLD) {
        await updateDoc(ref, { active: false });
        statusEl.textContent = "Video removed.";
    } else {
        statusEl.textContent = `Reported (${data.reports}/${REPORT_THRESHOLD})`;
    }

    loadVideo();
});
