import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  let body: any = null;

  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const sub = body?.subscription;
  if (!sub?.endpoint) return jsonError("Missing subscription.endpoint", 400);

  // Web Push subscription keys are usually inside: subscription.keys.p256dh + subscription.keys.auth
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;

  if (!p256dh || !auth) return jsonError("Missing subscription.keys (p256dh/auth)", 400);

  try {
    const db = supabaseAdmin();

    // Store as separate columns to avoid jsonb parsing issues
    const row = {
      endpoint: String(sub.endpoint),
      p256dh: String(p256dh),
      auth: String(auth),
      user_role: "admin",
    };

    // Upsert by unique endpoint
    const { error } = await db
      .from("push_subscriptions")
      .upsert([row], { onConflict: "endpoint" });

    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return jsonError("Server error", 500);
  }
}