const PLAN_CONFIG = {
  sadhu_seva: {
    env: "RAZORPAY_PLAN_SADHU_SEVA",
    label: "Sadhu Seva",
    amount: 12800
  },
  trustee: {
    env: "RAZORPAY_PLAN_TRUSTEE",
    label: "Bhaktamandali Trustee",
    amount: 102800
  }
};

function clean(value, max = 160) {
  return String(value || "").trim().slice(0, max);
}

function json(response, status, payload) {
  response.status(status).json(payload);
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { error: "Method not allowed." });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return json(response, 503, {
      error: "Razorpay is not configured on this deployment."
    });
  }

  const body = request.body || {};
  const planKey = clean(body.plan, 40);
  const plan = PLAN_CONFIG[planKey];

  if (!plan) {
    return json(response, 400, { error: "Invalid premium seva pathway." });
  }

  const planId = process.env[plan.env];
  if (!planId) {
    return json(response, 503, {
      error: `${plan.label} is not configured in Razorpay yet.`
    });
  }

  const name = clean(body.name, 100);
  const mobile = clean(body.mobile, 30);
  const email = clean(body.email, 120);
  const location = clean(body.location, 100);

  if (!name || !mobile) {
    return json(response, 400, {
      error: "Full name and mobile number are required."
    });
  }

  const cyclesRaw = Number(process.env.RAZORPAY_SUBSCRIPTION_CYCLES || 120);
  const totalCount = Number.isInteger(cyclesRaw)
    ? Math.min(Math.max(cyclesRaw, 1), 120)
    : 120;

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  try {
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        plan_id: planId,
        total_count: totalCount,
        quantity: 1,
        customer_notify: 1,
        notes: {
          member_name: name,
          mobile,
          email: email || "not-provided",
          location: location || "not-provided",
          seva_pathway: plan.label,
          website: "kalika-peetham"
        }
      })
    });

    const data = await razorpayResponse.json().catch(() => ({}));

    if (!razorpayResponse.ok || !data.id) {
      console.error("Razorpay create subscription failed", {
        status: razorpayResponse.status,
        error: data?.error?.description || data?.error?.reason || "unknown"
      });
      return json(response, 502, {
        error: data?.error?.description || "Unable to start Razorpay subscription."
      });
    }

    return json(response, 200, {
      keyId,
      subscriptionId: data.id,
      plan: planKey,
      planLabel: plan.label,
      amount: plan.amount,
      currency: "INR"
    });
  } catch (error) {
    console.error("Razorpay create subscription exception", error);
    return json(response, 500, {
      error: "Unable to contact Razorpay. Please try again."
    });
  }
}
