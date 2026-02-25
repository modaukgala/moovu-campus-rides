import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { sendAdminPush } from "@/lib/push";
import { AREAS, type Area, getFareCents } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateRideRequestBody = {
  student_name: string;
  student_number?: string | null;
  phone: string;
  pickup: string;
  dropoff: string;
  pickup_area?: string | null;
  dropoff_area?: string | null; // optional if you have it in UI
  passengers?: number;
  notes?: string | null;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function toArea(value: unknown): Area | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return (AREAS as readonly string[]).includes(trimmed) ? (trimmed as Area) : null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Partial<CreateRideRequestBody> | null;

    if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });

    const required: (keyof CreateRideRequestBody)[] = ["student_name", "phone", "pickup", "dropoff"];
    for (const k of required) {
      const value = body[k];
      if (!isNonEmptyString(value)) {
        return NextResponse.json({ ok: false, error: `Missing field: ${String(k)}` }, { status: 400 });
      }
    }

    // passengers clamp (1–3)
    const passengers = Number(body.passengers ?? 1);
    const safePassengers = Number.isFinite(passengers) ? Math.min(Math.max(passengers, 1), 3) : 1;

    // ✅ Convert incoming strings to Area union (or null if not in list)
    const from = toArea(body.pickup_area ?? body.pickup);
    const to = toArea(body.dropoff_area ?? body.dropoff);

    // ✅ Fare in cents (because pricing table uses cents)
    const fareCents = from && to ? getFareCents(from, to) : null;

    // If your DB column fare_amount stores cents: keep this as fareCents
    // If your DB stores rands, change to: const fare_amount = typeof fareCents === "number" ? fareCents / 100 : null;
    const fare_amount = typeof fareCents === "number" ? fareCents : null;

    const db = supabaseAdmin();

    const { data, error } = await db
      .from("ride_requests")
      .insert([
        {
          student_name: body.student_name.trim(),
          student_number: body.student_number ?? null,
          phone: body.phone.trim(),
          pickup: body.pickup.trim(),
          dropoff: body.dropoff.trim(),
          pickup_area: from ?? body.pickup_area ?? null,
          passengers: safePassengers,
          notes: body.notes ?? null,
          status: "new",
          assigned_driver_id: null,
          auto_assign_attempted_at: null,
          fare_amount,
        },
      ])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // 🔔 Optional: notify admin (don’t break request if push fails)
    try {
      await sendAdminPush({
        title: "New Ride Request",
        body: `${data.pickup} → ${data.dropoff} (${data.passengers} pax)`,
        url: `/admin`,
      });
    } catch {
      // ignore push errors
    }

    return NextResponse.json({ ok: true, request: data });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}