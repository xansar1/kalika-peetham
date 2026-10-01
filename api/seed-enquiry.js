import { callSupabaseRpc } from "./_supabase.js";

function clean(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const body = request.body || {};
  const fullName = clean(body.name, 100);
  const mobile = clean(body.mobile, 30);

  if (!fullName || !mobile) {
    return response.status(400).json({
      error: "Full name and mobile number are required."
    });
  }

  try {
    const id = await callSupabaseRpc("register_seed_enquiry", {
      p_full_name: fullName,
      p_mobile: mobile,
      p_email: clean(body.email, 120),
      p_organization: clean(body.organization, 150),
      p_interest: clean(body.interest, 100),
      p_message: clean(body.message, 1000)
    });

    return response.status(200).json({ ok: true, id });
  } catch (error) {
    console.error("Seed Plant enquiry save failed", error);
    return response.status(500).json({
      error: "Unable to save the enquiry right now."
    });
  }
}
