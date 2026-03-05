require("firebase-admin");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const admin = require("firebase-admin");

// Initialize Firebase Admin using service account JSON from Netlify
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
}

const db = admin.firestore();

// Map Stripe Price IDs → Credits to add
const CREDIT_MAP = {
  "price_1T4YZPQeHhafnMhGqcJZsjs8": 100,
  "price_1T4YlNQeHhafnMhGuZxTm8SO": 220,
  "price_1T4YzvQeHhafnMhGp9yzzM4O": 600,
  "price_1T4Z3sQeHhafnMhGbTgBYywg": 1300,
  "price_1T4Z7fQeHhafnMhGu5sJj5z4": 2800
};

exports.handler = async (event) => {
  const sig = event.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // 🔍 Debug: confirm environment variable is available at runtime
  console.log("FIREBASE_SERVICE_ACCOUNT exists:", !!process.env.FIREBASE_SERVICE_ACCOUNT);

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;

    const uid = session.metadata?.uid;
    const priceId = session.metadata?.priceId;

    const creditsToAdd = CREDIT_MAP[priceId];

    if (uid && creditsToAdd) {
      const userRef = db.collection("users").doc(uid);

      await userRef.set(
        { credits: admin.firestore.FieldValue.increment(creditsToAdd) },
        { merge: true }
      );

      console.log(`Added ${creditsToAdd} credits to user ${uid}`);
    }
  }

  return { statusCode: 200, body: "success" };
};

