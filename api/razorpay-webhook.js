import crypto from "node:crypto";

function safeEqualHex(a, b) {
  try {
    const left = Buffer.from(String(a || ""), "hex");
    const right = Buffer.from(String(b || ""), "hex");
    return left.length > 0 &&
      left.length === right.length &&
      crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return response.status(503).json({
      error: "Webhook secret is not configured."
    });
  }

  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks);
  const signature = request.headers["x-razorpay-signature"];

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (!safeEqualHex(expected, signature)) {
    return response.status(400).json({ error: "Invalid webhook signature." });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return response.status(400).json({ error: "Invalid JSON payload." });
  }

  // No database is connected yet. Verified webhook events are logged so that
  // persistent member/payment status storage can be added next.
  console.log("Verified Razorpay webhook", {
    event: event.event,
    subscriptionId: event?.payload?.subscription?.entity?.id || null,
    paymentId: event?.payload?.payment?.entity?.id || null
  });

  return response.status(200).json({ ok: true });
}
