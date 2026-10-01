function jsonHeaders() {
  return {
    "Content-Type": "application/json",
    "apikey": process.env.SUPABASE_PUBLISHABLE_KEY || "",
    "Authorization": `Bearer ${process.env.SUPABASE_PUBLISHABLE_KEY || ""}`
  };
}

export function supabaseReady() {
  return Boolean(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_PUBLISHABLE_KEY &&
    process.env.SUPABASE_BACKEND_TOKEN
  );
}

export async function callSupabaseRpc(name, payload) {
  if (!supabaseReady()) {
    throw new Error("Supabase is not configured on this deployment.");
  }

  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/rpc/${encodeURIComponent(name)}`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        p_backend_token: process.env.SUPABASE_BACKEND_TOKEN,
        ...payload
      })
    }
  );

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.hint ||
      data?.details ||
      (typeof data === "string" ? data : "") ||
      "Supabase request failed.";
    throw new Error(message);
  }

  return data;
}
