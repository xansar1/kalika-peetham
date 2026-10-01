import { callSupabaseRpc } from "./_supabase.js";
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

  const subscriptionEntity = event?.payload?.subscription?.entity || null;
  const paymentEntity = event?.payload?.payment?.entity || null;
  const subscriptionId =
    subscriptionEntity?.id ||
    paymentEntity?.subscription_id ||
    null;
  const paymentId = paymentEntity?.id || null;
  const status =
    subscriptionEntity?.status ||
    paymentEntity?.status ||
    event?.event ||
    null;
  const amount = Number.isFinite(paymentEntity?.amount)
    ? paymentEntity.amount
    : null;
  const currency = paymentEntity?.currency || "INR";

  try {
    await callSupabaseRpc("record_razorpay_event", {
      p_event_type: event.event || "unknown",
      p_razorpay_subscription_id: subscriptionId,
      p_razorpay_payment_id: paymentId,
      p_status: status,
      p_amount: amount,
      p_currency: currency,
      p_raw_event: event
    });
  } catch (dbError) {
    console.error("Verified Razorpay webhook could not be persisted", dbError);
    return response.status(500).json({
      error: "Webhook verified, but database persistence failed."
    });
  }

  console.log("Verified Razorpay webhook stored", {
    event: event.event,
    subscriptionId,
    paymentId
  });

  return response.status(200).json({ ok: true });
}
