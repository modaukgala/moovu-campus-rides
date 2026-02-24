import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function isAdmin(req: Request) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const expected = (process.env.ADMIN_KEY || "").trim();
  return Boolean(expected) && key === expected;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(req: Request) {
  if (!isAdmin(req)) return jsonError("Unauthorized", 401);

  try {
    const url = new URL(req.url);
    const status = (url.searchParams.get("status") || "").trim(); // optional
    const limitRaw = url.searchParams.get("limit");
    const limit = Math.max(1, Math.min(Number(limitRaw || 200), 500)); // clamp 1..500

    const db = supabaseAdmin();

    let q = db
      .from("ride_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) q = q.eq("status", status);

    const { data, error } = await q;

    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ ok: true, requests: data || [] }, { status: 200 });
  } catch {
    return jsonError("Server error", 500);
  }
}