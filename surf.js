/* --------------------------------------------------
   FIREBASE v10 SETUP
-------------------------------------------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCdVQD50oh4U2J6vDlgluOXrzerGyaxiV8",
  authDomain: "play4traffic.firebaseapp.com",
  projectId: "play4traffic",
  storageBucket: "play4traffic.firebasestorage.app",
  messagingSenderId: "82841843986",
  appId: "1:82841843986:web:beb2ae3944b10ba3521bcb"
};

let db = null;
let currentUserId = localStorage.getItem("uid") || null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase failed to initialize:", e);
}

/* --------------------------------------------------
   STRIPE CONFIG (CLIENT-SIDE)
-------------------------------------------------- */
const stripe = Stripe("pk_live_51T4M4SQeHhafnMhGk9C0vGs496UX6zSXtag8hnr6nQG7MQzHyWLyH0pAndHbTaUjm63CU2iiegBf1q4Y3cjNJdoj00RbPeTMai");

const STRIPE_PRICES = {
  100: "price_1T4YZPQeHhafnMhGqcJZsjs8",
  220: "price_1T4YlNQeHhafnMhGuZxTm8SO",
  600: "price_1T4YzvQeHhafnMhGp9yzzM4O",
  1300: "price_1T4Z3sQeHhafnMhGbTgBYywg",
  2800: "price_1T4Z7fQeHhafnMhGu5sJj5z4"
};

/* --------------------------------------------------
   SURF ENGINE DATA
-------------------------------------------------- */
let surfList = [
  "https://example1.com",
  "https://example2.com",
  "https://example3.com"
];

let index = 0;
let timer = 0;
let countdown;
let earned = 0;
let credits = 0;

/* --------------------------------------------------
   DOM ELEMENTS
-------------------------------------------------- */
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const timerDisplay = document.getElementById("timer");
const earnedDisplay = document.getElementById("earned");
const currentUrlDisplay = document.getElementById("current-url");
const creditsDisplay = document.getElementById("creditsDisplay");

const buyModal = document.getElementById("buyCreditsModal");
const openBuy = document.getElementById("openBuyCredits");
const closeBuy = document.getElementById("closeBuyCredits");
const buyButtons = document.querySelectorAll(".buy-package");

const rewardedAdContainer = document.getElementById("rewardedAdContainer");
const rewardedAdSlot = document.getElementById("rewardedAdSlot");
const rewardStatus = document.getElementById("rewardStatus");
const closeRewardedAd = document.getElementById("closeRewardedAd");
const watchAdBtn = document.getElementById("watchAdBtn");

/* --------------------------------------------------
   FIRESTORE LOAD/SAVE
-------------------------------------------------- */
async function loadCredits() {
  if (!db || !currentUserId) {
    console.warn("Skipping credit load — no Firebase or UID");
    creditsDisplay.textContent = credits;
    return;
  }

  try {
    const ref = doc(db, "users", currentUserId);
    const snap = await getDoc(ref);

    credits = snap.exists() ? snap.data().credits || 0 : 0;
    creditsDisplay.textContent = credits;
  } catch (e) {
    console.warn("Error loading credits:", e);
  }
}

async function saveCredits() {
  if (!db || !currentUserId) return;

  try {
    const ref = doc(db, "users", currentUserId);
    await setDoc(ref, { credits: credits }, { merge: true });
  } catch (e) {
    console.warn("Error saving credits:", e);
  }
}

/* --------------------------------------------------
   BUY CREDITS (STRIPE CHECKOUT)
-------------------------------------------------- */
openBuy.addEventListener("click", () => buyModal.style.display = "flex");
closeBuy.addEventListener("click", () => buyModal.style.display = "none");

buyButtons.forEach(btn => {
  btn.addEventListener("click", async () => {
    if (!currentUserId) {
      alert("Please log in first.");
      return;
    }

    const amount = parseInt(btn.dataset.amount);
    const priceId = STRIPE_PRICES[amount];
    if (!priceId) {
      console.warn("No Stripe price for amount:", amount);
      return;
    }

    try {
      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, uid: currentUserId })
      });

      const data = await res.json();
      if (data.id) {
        stripe.redirectToCheckout({ sessionId: data.id });
      } else {
        console.error("No session id:", data);
      }
    } catch (e) {
      console.error("Stripe checkout error:", e);
    }
  });
});

/* --------------------------------------------------
   OPTIONAL: PAYPAL BUTTONS
-------------------------------------------------- */
function renderPayPalButton(containerId, amountUSD, creditsToAdd) {
  if (!window.paypal) return;

  paypal.Buttons({
    createOrder: (data, actions) => {
      return actions.order.create({
        purchase_units: [{
          amount: { value: amountUSD.toString() }
        }]
      });
    },
    onApprove: async (data, actions) => {
      await actions.order.capture();

      credits += creditsToAdd;
      creditsDisplay.textContent = credits;
      await saveCredits();
    }
  }).render(containerId);
}

// Call these if you want PayPal active:
renderPayPalButton("#paypal-100", 1, 100);
renderPayPalButton("#paypal-220", 3, 220);
renderPayPalButton("#paypal-600", 5, 600);
renderPayPalButton("#paypal-1300", 10, 1300);
renderPayPalButton("#paypal-2800", 20, 2800);

/* --------------------------------------------------
   REWARDED AD
-------------------------------------------------- */
watchAdBtn.addEventListener("click", () => {
  rewardedAdContainer.style.display = "flex";
  rewardStatus.textContent = "Loading ad…";
  closeRewardedAd.disabled = true;

  rewardedAdSlot.innerHTML = "";

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://pl28612744.effectivegatecpm.com/09/a6/1e/09a61ea7b95b64df8ad23ba7ffa7f392.js";

  let adLoaded = false;

  script.onload = () => {
    adLoaded = true;
    rewardStatus.textContent = "Ad loaded. Watching…";

    setTimeout(async () => {
      const REWARD_CREDITS = 5;
      credits += REWARD_CREDITS;
      creditsDisplay.textContent = credits;
      await saveCredits();

      rewardStatus.textContent = `Ad completed! +${REWARD_CREDITS} credits added.`;
      closeRewardedAd.disabled = false;
    }, 20000);
  };

  script.onerror = () => {
    rewardStatus.textContent = "Ad failed to load. You can close this window.";
    closeRewardedAd.disabled = false;
  };

  setTimeout(() => {
    if (!adLoaded) {
      rewardStatus.textContent = "Ad took too long to load. You can close this window.";
      closeRewardedAd.disabled = false;
    }
  }, 10000);

  rewardedAdSlot.appendChild(script);
});

closeRewardedAd.addEventListener("click", () => {
  rewardedAdContainer.style.display = "none";
});

/* --------------------------------------------------
   SURF ENGINE (EARN CREDITS)
-------------------------------------------------- */
startBtn.addEventListener("click", () => {
  if (!currentUserId) {
    alert("Please log in first.");
    return;
  }
  startSurf();
});

nextBtn.addEventListener("click", () => {
  if (!currentUserId) {
    alert("Please log in first.");
    return;
  }
  nextSurf();
});

function startSurf() {
  index = 0;
  openSite(surfList[index]);
}

function nextSurf() {
  index++;
  if (index >= surfList.length) {
    currentUrlDisplay.textContent = "No more sites!";
    nextBtn.disabled = true;
    return;
  }
  openSite(surfList[index]);
}

function openSite(url) {
  window.open(url, "_blank");

  currentUrlDisplay.textContent = "Surfing: " + url;

  timer = 10;
  timerDisplay.textContent = timer;
  nextBtn.disabled = true;

  clearInterval(countdown);
  countdown = setInterval(async () => {
    timer--;
    timerDisplay.textContent = timer;

    if (timer <= 0) {
      clearInterval(countdown);
      nextBtn.disabled = false;

      const EARN_PER_SITE = 1;
      earned += EARN_PER_SITE;
      earnedDisplay.textContent = earned;

      credits += EARN_PER_SITE;
      creditsDisplay.textContent = credits;
      await saveCredits();
    }
  }, 1000);
}

/* --------------------------------------------------
   INIT
-------------------------------------------------- */
loadCredits();
