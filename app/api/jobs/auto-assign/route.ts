import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function normalize(s: any) {
  return String(s || "").trim().toLowerCase();
}

export async function POST(req: Request) {
  // 🔐 SECURITY CHECK
  const jobKey = (req.headers.get("x-job-key") || "").trim();
  const expected = (process.env.JOB_KEY || "").trim();

  if (!expected || jobKey !== expected) {
    return jsonError("Unauthorized job", 401);
  }

  try {
    const db = supabaseAdmin();

    // ⏱️ find unassigned requests older than 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString();

    const { data: requests, error: reqErr } = await db
      .from("ride_requests")
      .select("id,pickup_area,status,assigned_driver_id,created_at")
      .eq("status", "new")
      .is("assigned_driver_id", null)
      .lt("created_at", thirtySecondsAgo)
      .order("created_at", { ascending: true })
      .limit(50);

    if (reqErr) return jsonError(reqErr.message, 500);

    if (!requests || requests.length === 0) {
      return NextResponse.json({ ok: true, checkedCount: 0, assignedCount: 0 }, { status: 200 });
    }

    // 🚗 get available drivers
    const { data: drivers, error: drvErr } = await db
      .from("drivers")
      .select("id,campus_area,is_active,subscription_status")
      .eq("is_active", true)
      .eq("subscription_status", "active");

    if (drvErr) return jsonError(drvErr.message, 500);

    if (!drivers || drivers.length === 0) {
      // Optional: mark attempted so it doesn't spam-check same old requests forever
      // (Only do this if you have auto_assign_attempted_at column)
      return NextResponse.json(
        { ok: true, checkedCount: requests.length, assignedCount: 0, note: "No available drivers" },
        { status: 200 }
      );
    }

    let assignedCount = 0;

    for (const r of requests) {
      const preferredArea = normalize(r.pickup_area);

      const sameAreaDrivers = drivers.filter(
        (d) => normalize(d.campus_area) === preferredArea && preferredArea.length > 0
      );

      const pool = sameAreaDrivers.length > 0 ? sameAreaDrivers : drivers;

      // Pick first available (simple). We can add round-robin later.
      const chosen = pool[0];

      // ✅ Race-safe update: only assign if still unassigned & still status=new
      const { data: updated, error: upErr } = await db
        .from("ride_requests")
        .update({
          assigned_driver_id: chosen.id,
          status: "assigned",
          auto_assign_attempted_at: new Date().toISOString(),
        })
        .eq("id", r.id)
        .eq("status", "new")
        .is("assigned_driver_id", null)
        .select("id")
        .maybeSingle();

      // If your table DOES NOT have auto_assign_attempted_at, remove it above or add the column.
      if (upErr) return jsonError(upErr.message, 500);

      if (updated?.id) assignedCount++;
    }

    return NextResponse.json(
      { ok: true, checkedCount: requests.length, assignedCount },
      { status: 200 }
    );
  } catch {
    return jsonError("Server error", 500);
  }
}