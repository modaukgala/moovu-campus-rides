import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

// Simple admin key check (server-side env).
// NOTE: Ensure ADMIN_KEY is set in .env.local and on your deployed host.
function isAdmin(req: Request) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const expected = (process.env.ADMIN_KEY || "").trim();
  return Boolean(expected) && key === expected;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function normalizeSubscriptionStatus(v: any) {
  const s = String(v || "").trim().toLowerCase();
  return s === "active" ? "active" : "inactive";
}

export async function GET(req: Request) {
  if (!isAdmin(req)) return jsonError("Unauthorized", 401);

  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("drivers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ ok: true, drivers: data || [] }, { status: 200 });
  } catch {
    return jsonError("Server error", 500);
  }
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return jsonError("Unauthorized", 401);

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const full_name = String(body?.full_name || "").trim();
  const phone = String(body?.phone || "").trim();

  if (!full_name) return jsonError("full_name is required", 400);
  if (!phone) return jsonError("phone is required", 400);

  const driver = {
    full_name,
    phone,
    car_model: body?.car_model ? String(body.car_model).trim() : null,
    car_color: body?.car_color ? String(body.car_color).trim() : null,
    plate_number: body?.plate_number ? String(body.plate_number).trim() : null,
    campus: body?.campus ? String(body.campus).trim() : null,

    // Optional new field (only works if you added it in Supabase):
    campus_area: body?.campus_area ? String(body.campus_area).trim() : null,

    is_active: typeof body?.is_active === "boolean" ? body.is_active : true,
    subscription_status: normalizeSubscriptionStatus(body?.subscription_status),
  };

  try {
    const db = supabaseAdmin();
    const { data, error } = await db.from("drivers").insert([driver]).select().single();

    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ ok: true, driver: data }, { status: 200 });
  } catch {
    return jsonError("Server error", 500);
  }
}