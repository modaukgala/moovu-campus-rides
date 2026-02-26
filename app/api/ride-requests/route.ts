import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { sendAdminPush } from "@/lib/push";
import { getFareCents, AREAS, type Area } from "@/lib/pricing";
import { autoAssignPending } from "@/lib/autoAssign";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function toArea(value: unknown): Area | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return (AREAS as readonly string[]).includes(trimmed) ? (trimmed as Area) : null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Partial<CreateRideRequestBody> | null;
    if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });

    // ✅ validate required fields
    const required: (keyof CreateRideRequestBody)[] = ["student_name", "phone", "pickup", "dropoff"];
    for (const k of required) {
      const value = body[k];
      if (!isNonEmptyString(value)) {
        return NextResponse.json({ ok: false, error: `Missing field: ${String(k)}` }, { status: 400 });
      }
    }

    // ✅ promote to guaranteed strings (fixes Vercel strict build)
    const student_name = body.student_name!.trim();
    const phone = body.phone!.trim();
    const pickup = body.pickup!.trim();
    const dropoff = body.dropoff!.trim();

    // ✅ passengers clamp (1–3)
    const passengers = Number(body.passengers ?? 1);
    const safePassengers = Number.isFinite(passengers) ? Math.min(Math.max(passengers, 1), 3) : 1;

    // ✅ pricing (ONE-WAY)
    const from = toArea(body.pickup_area ?? pickup);
    const to = toArea(dropoff);

    const fareCents = from && to ? getFareCents(from, to) : null;

    // Store cents in DB (recommended). If your DB stores rands, change to: fareCents / 100
    const fare_amount = typeof fareCents === "number" ? fareCents : null;

    const db = supabaseAdmin();

    const { data, error } = await db
      .from("ride_requests")
      .insert([
        {
          student_name,
          student_number: body.student_number ?? null,
          phone,
          pickup,
          dropoff,
          pickup_area: from ?? body.pickup_area ?? null,
          passengers: safePassengers,
          notes: body.notes ? String(body.notes) : null,
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
      await autoAssignPending({ minAgeMs: 0, onlyRequestId: data.id });
      
      // 🔔 notify admin (don't fail the request if push fails)
      try {
       await sendAdminPush({
        title: "New Ride Request",
        body: `${student_name}: ${pickup} → ${dropoff}`,
        url: `/request/status/${data.id}`,
      });
    } catch {}

    return NextResponse.json({ ok: true, request: data });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}