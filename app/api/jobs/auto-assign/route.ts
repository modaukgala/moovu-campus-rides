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
  created_at?: string;
};

function normalize(s: string | null | undefined) {
  return (s ?? "").trim().toLowerCase();
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

async function readJson(req: Request): Promise<unknown | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const db = supabaseAdmin();

  const jobKey = req.headers.get("x-job-key");
  const isJobCall = Boolean(process.env.JOB_KEY) && jobKey === process.env.JOB_KEY;

  const body = await readJson(req);

  /**
   * ✅ MODE A (SECURE / ADMIN / CRON)
   * If x-job-key is correct, we can batch process old requests.
   */
  if (isJobCall) {
    const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString();

    const { data: requests, error: reqErr } = await db
      .from("ride_requests")
      .select("id, pickup_area, created_at")
      .eq("status", "new")
      .is("assigned_driver_id", null)
      .is("auto_assign_attempted_at", null)
      .lt("created_at", thirtySecondsAgo)
      .order("created_at", { ascending: true });

    if (reqErr) return NextResponse.json({ ok: false, error: reqErr.message }, { status: 500 });

    const reqs = (requests ?? []) as unknown as RequestRow[];
    if (reqs.length === 0) return NextResponse.json({ ok: true, mode: "job", checkedCount: 0, assignedCount: 0 });

    const { data: drivers, error: drvErr } = await db
      .from("drivers")
      .select("id, campus_area")
      .eq("is_active", true)
      .eq("subscription_status", "active");

    if (drvErr) return NextResponse.json({ ok: false, error: drvErr.message }, { status: 500 });

    const drvs = (drivers ?? []) as unknown as DriverRow[];
    if (drvs.length === 0) return NextResponse.json({ ok: true, mode: "job", checkedCount: reqs.length, assignedCount: 0 });

    let assignedCount = 0;
    let pickIndex = 0;

    for (const r of reqs) {
      const preferred = normalize(r.pickup_area);

      const sameArea = preferred
        ? drvs.filter((d) => normalize(d.campus_area) === preferred)
        : [];

      const pool = sameArea.length > 0 ? sameArea : drvs;
      const chosen = pool[pickIndex % pool.length];
      pickIndex++;

      const { error: upErr } = await db
        .from("ride_requests")
        .update({
          assigned_driver_id: chosen.id,
          status: "assigned",
          auto_assign_attempted_at: new Date().toISOString(),
        })
        .eq("id", r.id)
        .eq("status", "new")
        .is("assigned_driver_id", null);

      if (!upErr) assignedCount++;
    }

    return NextResponse.json({ ok: true, mode: "job", checkedCount: reqs.length, assignedCount });
  }

  /**
   * ✅ MODE B (PUBLIC, NO SECRET)
   * Must provide requestId to assign ONLY that one request.
   * This is what your student status page should call after 15s.
   */

  const requestId =
   body && typeof body === "object" && "requestId" in body
     ? (body as { requestId?: unknown }).requestId
     : undefined;

  if (!isNonEmptyString(requestId)) {
    return NextResponse.json(
      { ok: false, error: "Missing requestId (public mode)" },
      { status: 400 }
    );
  }

  // only assign if older than 15 seconds (prevents instant spam clicking)
  const fifteenSecondsAgo = new Date(Date.now() - 15_000).toISOString();

  const { data: reqRow, error: oneErr } = await db
    .from("ride_requests")
    .select("id, pickup_area, created_at, status, assigned_driver_id")
    .eq("id", requestId)
    .single();

  if (oneErr || !reqRow) {
    return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
  }

  // already assigned/done? stop
  if (reqRow.status !== "new" || reqRow.assigned_driver_id) {
    return NextResponse.json({ ok: true, mode: "public", assigned: false, reason: "already_assigned_or_not_new" });
  }

  // too new? wait a bit
  if (reqRow.created_at && reqRow.created_at > fifteenSecondsAgo) {
    return NextResponse.json({ ok: true, mode: "public", assigned: false, reason: "too_new_wait" });
  }

  const { data: drivers, error: drvErr } = await db
    .from("drivers")
    .select("id, campus_area")
    .eq("is_active", true)
    .eq("subscription_status", "active");

  if (drvErr) return NextResponse.json({ ok: false, error: drvErr.message }, { status: 500 });

  const drvs = (drivers ?? []) as unknown as DriverRow[];
  if (drvs.length === 0) {
    // mark attempted so it doesn’t keep trying forever
    await db
      .from("ride_requests")
      .update({ auto_assign_attempted_at: new Date().toISOString() })
      .eq("id", requestId);

    return NextResponse.json({ ok: true, mode: "public", assigned: false, reason: "no_active_drivers" });
  }

  const preferred = normalize(reqRow.pickup_area);
  const sameArea = preferred ? drvs.filter((d) => normalize(d.campus_area) === preferred) : [];
  const pool = sameArea.length > 0 ? sameArea : drvs;
  const chosen = pool[0]; // simple deterministic choice

  const { error: upErr } = await db
    .from("ride_requests")
    .update({
      assigned_driver_id: chosen.id,
      status: "assigned",
      auto_assign_attempted_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "new")
    .is("assigned_driver_id", null);

  if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, mode: "public", assigned: true, requestId, driverId: chosen.id });
}