import { supabaseReady } from "./_supabase.js";

export default function handler(request, response) {
  response.status(200).json({
    ok: true,
    service: "kalika-peetham",
    razorpayConfigured: Boolean(
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_PLAN_SADHU_SEVA &&
      process.env.RAZORPAY_PLAN_TRUSTEE
    ),
    supabaseConfigured: supabaseReady()
  });
}
