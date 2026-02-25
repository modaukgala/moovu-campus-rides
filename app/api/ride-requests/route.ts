import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { sendAdminPush } from "@/lib/push";
import { getFareCents } from "@/lib/pricing";

type CreateRideRequestBody = {
  student_name: string;
  student_number?: string | null;
  phone: string;
  pickup: string;
  dropoff: string;
  pickup_area?: string | null;
  passengers?: number;
  notes?: string | null;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Partial<CreateRideRequestBody> | null;

    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const required: (keyof CreateRideRequestBody)[] = ["student_name", "phone", "pickup", "dropoff"];
    for (const k of required) {
      const value = body[k];
      if (!isNonEmptyString(value)) {
        return NextResponse.json({ error: `Missing field: ${String(k)}` }, { status: 400 });
      }
    }

    const passengers = Number(body.passengers ?? 1);
    const safePassengers = Number.isFinite(passengers) ? Math.min(Math.max(passengers, 1), 3) : 1;

    // fare: optional (null if unknown)
    const fareCents = getFareCents(String(body.pickup), String(body.dropoff));
    const fare_amount = typeof fareCents === "number" ? fareCents / 100 : null;

    const db = supabaseAdmin();
    const { data, error } = await db
      .from("ride_requests")
      .insert([
        {
          student_name: String(body.student_name).trim(),
          student_number: body.student_number ? String(body.student_number).trim() : null,
          phone: String(body.phone).trim(),
          pickup: String(body.pickup).trim(),
          dropoff: String(body.dropoff).trim(),
          passengers: safePassengers,
          notes: body.notes ? String(body.notes).trim() : null,
          status: "new",
          pickup_area: body.pickup_area ? String(body.pickup_area).trim() : null,
          fare_amount,
        },
      ])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // push (non-blocking)
    try {
      await sendAdminPush({
        title: "New Ride Request",
        body: `${data.pickup} → ${data.dropoff} • ${data.passengers} pax`,
        url: "/admin",
      });
    } catch {
      // ignore
    }

    return NextResponse.json({ ok: true, request: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}