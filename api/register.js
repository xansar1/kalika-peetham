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
  const email = clean(body.email, 120);
  const location = clean(body.location, 120);
  const message = clean(body.message, 1000);
  const interest = clean(body.interest, 40);

  if (!fullName || !mobile) {
    return response.status(400).json({
      error: "Full name and mobile number are required."
    });
  }

  try {
    if (interest === "Volunteer") {
      const id = await callSupabaseRpc("register_volunteer", {
        p_full_name: fullName,
        p_mobile: mobile,
        p_email: email,
        p_location: location,
        p_message: message
      });

      return response.status(200).json({
        ok: true,
        type: "volunteer",
        id
      });
    }

    const id = await callSupabaseRpc("register_member", {
      p_full_name: fullName,
      p_mobile: mobile,
      p_email: email,
      p_location: location,
      p_message: message,
      p_membership_type: "regular"
    });

    return response.status(200).json({
      ok: true,
      type: "member",
      id
    });
  } catch (error) {
    console.error("Registration save failed", error);
    return response.status(500).json({
      error: "Unable to save the registration right now."
    });
  }
}
