import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DriverRow = { id: string; campus_area: string | null };
type RequestRow = { id: string; pickup_area: string | null; created_at: string };

const DELAY_MS = 30_000; // 30 seconds

export async function POST(req: Request) {
  // 🔐 Job security
  const jobKey = req.headers.get("x-job-key");
  if (!jobKey || jobKey !== process.env.JOB_KEY) {
    return NextResponse.json({ error: "Unauthorized job" }, { status: 401 });
  }

  const db = supabaseAdmin();

  // Only requests created <= now - 30 seconds
  const cutoffIso = new Date(Date.now() - DELAY_MS).toISOString();

  const { data: requests, error: reqErr } = await db
    .from("ride_requests")
    .select("id, pickup_area, created_at")
    .eq("status", "new")
    .is("assigned_driver_id", null)
    .is("auto_assign_attempted_at", null)
    .lte("created_at", cutoffIso)
    .order("created_at", { ascending: true })
    .limit(25);

  if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 });

  const reqs = (requests ?? []) as unknown as RequestRow[];
  if (reqs.length === 0) {
    return NextResponse.json({ ok: true, checkedCount: 0, assignedCount: 0 });
  }

  const { data: drivers, error: drvErr } = await db
    .from("drivers")
    .select("id, campus_area")
    .eq("is_active", true)
    .eq("subscription_status", "active");

  if (drvErr) return NextResponse.json({ error: drvErr.message }, { status: 500 });

  const drvs = (drivers ?? []) as unknown as DriverRow[];
  if (drvs.length === 0) {
    // Mark attempted so we don’t keep reprocessing the same requests forever
    await db
      .from("ride_requests")
      .update({ auto_assign_attempted_at: new Date().toISOString() })
      .in("id", reqs.map((r) => r.id));

    return NextResponse.json({ ok: true, checkedCount: reqs.length, assignedCount: 0 });
  }

  let assignedCount = 0;

  for (const r of reqs) {
    const preferred = (r.pickup_area ?? "").trim().toLowerCase();

    const sameArea =
      preferred.length > 0
        ? drvs.filter((d) => (d.campus_area ?? "").trim().toLowerCase() === preferred)
        : [];

    const pool = sameArea.length > 0 ? sameArea : drvs;
    const chosen = pool[assignedCount % pool.length];

    const { error: upErr } = await db
      .from("ride_requests")
      .update({
        assigned_driver_id: chosen.id,
        status: "assigned",
        auto_assign_attempted_at: new Date().toISOString(),
      })
      .eq("id", r.id)
      .is("assigned_driver_id", null); // extra safety

    if (!upErr) assignedCount++;
  }

  return NextResponse.json({ ok: true, checkedCount: reqs.length, assignedCount });
}