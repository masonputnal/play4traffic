const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { priceId, uid } = JSON.parse(event.body || "{}");

    if (!priceId || !uid) {
      return { statusCode: 400, body: "Missing priceId or uid" };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: "https://play4traffic.netlify.app/success",
      cancel_url: "https://play4traffic.netlify.app/cancel",
      metadata: { uid, priceId }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    console.error("Stripe session error:", err);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
