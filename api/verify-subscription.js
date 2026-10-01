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

  return response.status(200).json({
    verified: true,
    paymentId,
    subscriptionId
  });
}
