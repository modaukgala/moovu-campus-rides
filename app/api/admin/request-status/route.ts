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

const allowed = new Set(["new", "assigned", "completed", "cancelled"]);

// Basic transition rules to avoid broken states
function isValidTransition(from: string, to: string) {
  if (from === to) return true;

  // Once completed/cancelled, don't reopen via this endpoint
  if (from === "completed" || from === "cancelled") {
    return false;
  }

  // From new you can go to assigned or cancelled
  if (from === "new") {
    return to === "assigned" || to === "cancelled";
  }

  // From assigned you can go to completed or cancelled
  if (from === "assigned") {
    return to === "completed" || to === "cancelled";
  }

  return false;
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
  const nextStatus = String(body?.status || "").trim();

  if (!requestId) return jsonError("requestId is required", 400);
  if (!allowed.has(nextStatus)) return jsonError("Invalid status", 400);

  try {
    const db = supabaseAdmin();

    // Load current request state
    const { data: reqRow, error: reqErr } = await db
      .from("ride_requests")
      .select("id,status,assigned_driver_id")
      .eq("id", requestId)
      .single();

    if (reqErr || !reqRow) return jsonError("Ride request not found", 404);

    const currentStatus = String(reqRow.status || "").trim();

    if (!isValidTransition(currentStatus, nextStatus)) {
      return jsonError(`Invalid status transition: ${currentStatus} → ${nextStatus}`, 400);
    }

    // Cannot mark "assigned" if no driver is assigned
    if (nextStatus === "assigned" && !reqRow.assigned_driver_id) {
      return jsonError("Cannot set status to 'assigned' without an assigned driver", 400);
    }

    const { data: updated, error: upErr } = await db
      .from("ride_requests")
      .update({ status: nextStatus })
      .eq("id", requestId)
      .select("id,status,assigned_driver_id")
      .single();

    if (upErr) return jsonError(upErr.message, 500);

    return NextResponse.json({ ok: true, request: updated }, { status: 200 });
  } catch {
    return jsonError("Server error", 500);
  }
}