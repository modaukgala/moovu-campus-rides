import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

type DriverRow = {
  id: string;
  campus_area: string | null;
};

type RequestRow = {
  id: string;
  pickup_area: string | null;
};

export async function POST(req: Request) {
  const jobKey = req.headers.get("x-job-key");
  if (!jobKey || jobKey !== process.env.JOB_KEY) {
    return NextResponse.json({ error: "Unauthorized job" }, { status: 401 });
  }

  const db = supabaseAdmin();

  // requests older than 30s, not assigned, not attempted
  const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString();

  const { data: requests, error: reqErr } = await db
    .from("ride_requests")
    .select("id, pickup_area")
    .eq("status", "new")
    .is("assigned_driver_id", null)
    .is("auto_assign_attempted_at", null)
    .lt("created_at", thirtySecondsAgo)
    .order("created_at", { ascending: true });

  if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 });
  const reqs = (requests ?? []) as unknown as RequestRow[];
  if (reqs.length === 0) return NextResponse.json({ ok: true, checkedCount: 0, assignedCount: 0 });

  const { data: drivers, error: drvErr } = await db
    .from("drivers")
    .select("id, campus_area")
    .eq("is_active", true)
    .eq("subscription_status", "active");

  if (drvErr) return NextResponse.json({ error: drvErr.message }, { status: 500 });
  const drvs = (drivers ?? []) as unknown as DriverRow[];
  if (drvs.length === 0) return NextResponse.json({ ok: true, checkedCount: reqs.length, assignedCount: 0 });

  let assignedCount = 0;

  for (const r of reqs) {
    const preferred = (r.pickup_area ?? "").trim().toLowerCase();

    const sameArea = preferred
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
      .eq("id", r.id);

    if (!upErr) assignedCount++;
  }

  return NextResponse.json({ ok: true, checkedCount: reqs.length, assignedCount });
}