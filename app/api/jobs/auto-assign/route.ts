import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DriverRow = {
  id: string;
  campus_area: string | null;
};

type RequestRow = {
  id: string;
  pickup_area: string | null;
};

function isAuthorized(req: Request) {
  const keyHeader = req.headers.get("x-job-key");
  const url = new URL(req.url);
  const keyQuery = url.searchParams.get("key"); // useful for Vercel cron (no headers)
  const jobKey = process.env.JOB_KEY;

  if (!jobKey) return false;
  return keyHeader === jobKey || keyQuery === jobKey;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized job" }, { status: 401 });
  }

  const db = supabaseAdmin();

  // threshold: must be older than 30 seconds
  const threshold = new Date(Date.now() - 10_000).toISOString();

  // 1) Find eligible requests
  const { data: requests, error: reqErr } = await db
    .from("ride_requests")
    .select("id, pickup_area")
    .eq("status", "new")
    .is("assigned_driver_id", null)
    .is("auto_assign_attempted_at", null)
    .lt("created_at", threshold)
    .order("created_at", { ascending: true });

  if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 });

  const reqs = (requests ?? []) as unknown as RequestRow[];
  if (reqs.length === 0) {
    return NextResponse.json({ ok: true, checkedCount: 0, assignedCount: 0, threshold });
  }

  // 2) Get available drivers
  const { data: drivers, error: drvErr } = await db
    .from("drivers")
    .select("id, campus_area")
    .eq("is_active", true)
    .eq("subscription_status", "active");

  if (drvErr) return NextResponse.json({ error: drvErr.message }, { status: 500 });

  const drvs = (drivers ?? []) as unknown as DriverRow[];
  if (drvs.length === 0) {
    // mark attempts so we don't keep re-checking forever
    await Promise.all(
      reqs.map((r) =>
        db
          .from("ride_requests")
          .update({ auto_assign_attempted_at: new Date().toISOString() })
          .eq("id", r.id)
          .is("assigned_driver_id", null)
          .eq("status", "new")
          .lt("created_at", threshold)
      )
    );

    return NextResponse.json({ ok: true, checkedCount: reqs.length, assignedCount: 0, threshold });
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

    // ✅ CRITICAL: enforce the 30s rule AGAIN in the update itself
    const { error: upErr } = await db
      .from("ride_requests")
      .update({
        assigned_driver_id: chosen.id,
        status: "assigned",
        auto_assign_attempted_at: new Date().toISOString(),
      })
      .eq("id", r.id)
      .eq("status", "new")
      .is("assigned_driver_id", null)
      .is("auto_assign_attempted_at", null)
      .lt("created_at", threshold);

    if (!upErr) assignedCount++;
  }

  return NextResponse.json({
    ok: true,
    checkedCount: reqs.length,
    assignedCount,
    threshold,
  });
}