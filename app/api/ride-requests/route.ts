import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { sendAdminPush } from "@/lib/push";
import { getFareCents, type Area } from "@/lib/pricing";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function clampPassengers(v: any) {
  const n = Number(v || 1);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(3, Math.round(n)));
}

export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  try {
    const student_name = String(body?.student_name || "").trim();
    const phone = String(body?.phone || "").trim();

    const pickup_area = String(body?.pickup_area || "").trim() as Area;
    const dropoff_area = String(body?.dropoff_area || "").trim() as Area;

    if (!student_name) return jsonError("Missing field: student_name", 400);
    if (!phone) return jsonError("Missing field: phone", 400);
    if (!pickup_area) return jsonError("Missing field: pickup_area", 400);
    if (!dropoff_area) return jsonError("Missing field: dropoff_area", 400);

    const fareCents = getFareCents(pickup_area, dropoff_area);
    if (fareCents === null) {
      return jsonError("This route has no fixed price yet.", 400);
    }

    const db = supabaseAdmin();

    const { data, error } = await db
      .from("ride_requests")
      .insert([
        {
          student_name,
          student_number: body?.student_number ? String(body.student_number).trim() : null,
          phone,

          pickup_area,
          dropoff_area,

          pickup: pickup_area,   // keep existing fields for display
          dropoff: dropoff_area, // keep existing fields for display

          passengers: clampPassengers(body?.passengers),
          notes: body?.notes ? String(body.notes).trim() : null,
          status: "new",

          fare_amount: fareCents,
        },
      ])
      .select()
      .single();

    if (error) return jsonError(error.message, 500);

    // Push notify admins (best-effort)
    try {
      await sendAdminPush({
        title: "New Ride Request",
        body: `${data.pickup_area} → ${data.dropoff_area} • R${(data.fare_amount / 100).toFixed(2)}`,
        url: "/admin",
      });
    } catch {}

    return NextResponse.json({ ok: true, request: data }, { status: 200 });
  } catch {
    return jsonError("Server error", 500);
  }
}