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

export async function POST(req: Request) {
  if (!isAdmin(req)) return jsonError("Unauthorized", 401);

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const requestId = String(body?.requestId || "").trim();
  const driverId = String(body?.driverId || "").trim();

  if (!requestId) return jsonError("requestId is required", 400);
  if (!driverId) return jsonError("driverId is required", 400);

  try {
    const db = supabaseAdmin();

    // 1) Ensure request exists and is assignable
    const { data: reqRow, error: reqErr } = await db
      .from("ride_requests")
      .select("id,status,assigned_driver_id")
      .eq("id", requestId)
      .single();

    if (reqErr || !reqRow) return jsonError("Ride request not found", 404);

    if (reqRow.status === "completed" || reqRow.status === "cancelled") {
      return jsonError(`Cannot assign a request with status: ${reqRow.status}`, 400);
    }

    if (reqRow.assigned_driver_id) {
      return jsonError("Request is already assigned", 409);
    }

    // 2) Ensure driver exists and is eligible
    const { data: drvRow, error: drvErr } = await db
      .from("drivers")
      .select("id,is_active,subscription_status")
      .eq("id", driverId)
      .single();

    if (drvErr || !drvRow) return jsonError("Driver not found", 404);

    if (!drvRow.is_active || String(drvRow.subscription_status).toLowerCase() !== "active") {
      return jsonError("Driver is not eligible (inactive or subscription inactive)", 400);
    }

    // 3) Assign safely (only if still unassigned)
    const { data: updated, error: upErr } = await db
      .from("ride_requests")
      .update({
        assigned_driver_id: driverId,
        status: "assigned",
        assigned_at: new Date().toISOString(), // safe even if column doesn't exist? (will error if missing)
      })
      .eq("id", requestId)
      .is("assigned_driver_id", null)
      .select("id,assigned_driver_id,status")
      .maybeSingle();

    // If your table DOES NOT have assigned_at, remove that line above.
    if (upErr) {
      // If you get a column error: remove assigned_at or add the column in Supabase
      return jsonError(upErr.message, 500);
    }

    if (!updated?.id) {
      // Another process assigned it between our check and update
      return jsonError("Request was assigned by another process", 409);
    }

    return NextResponse.json({ ok: true, request: updated }, { status: 200 });
  } catch {
    return jsonError("Server error", 500);
  }
}