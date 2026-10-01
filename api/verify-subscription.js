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

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return response.status(503).json({
      error: "Razorpay verification is not configured."
    });
  }

  const {
    razorpay_payment_id: paymentId,
    razorpay_subscription_id: subscriptionId,
    razorpay_signature: signature
  } = request.body || {};

  if (!paymentId || !subscriptionId || !signature) {
    return response.status(400).json({
      error: "Incomplete Razorpay payment response."
    });
  }

  // Razorpay subscription verification payload:
  // payment_id + "|" + subscription_id
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");

  if (!safeEqualHex(expected, signature)) {
    return response.status(400).json({
      verified: false,
      error: "Payment signature verification failed."
    });
  }

  try {
    await callSupabaseRpc("record_razorpay_event", {
      p_event_type: "checkout.signature_verified",
      p_razorpay_subscription_id: subscriptionId,
      p_razorpay_payment_id: paymentId,
      p_status: "verified",
      p_amount: null,
      p_currency: "INR",
      p_raw_event: {
        source: "checkout_callback",
        verified: true,
        razorpay_payment_id: paymentId,
        razorpay_subscription_id: subscriptionId
      }
    });
  } catch (dbError) {
    console.error("Payment signature verified but Supabase persistence failed", dbError);
    return response.status(500).json({
      verified: true,
      paymentId,
      subscriptionId,
      warning: "Payment verified, but database persistence failed."
    });
  }

  return response.status(200).json({
    verified: true,
    paymentId,
    subscriptionId
  });
}
