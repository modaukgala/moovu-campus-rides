import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

type RideStatus = "new" | "assigned" | "completed" | "cancelled";

type RideRequestRow = {
  id: string;
  student_name: string;
  phone: string;
  pickup: string;
  dropoff: string;
  passengers: number;
  status: RideStatus;
  assigned_driver_id: string | null;
  created_at: string;
  notes: string | null;
  pickup_area: string | null;
  fare_amount: number | null; // keep if you added this column
};

type DriverRow = {
  id: string;
  full_name: string;
  phone: string;
  car_model: string | null;
  car_color: string | null;
  plate_number: string | null;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const db = supabaseAdmin();

    // 1) Load request
    const { data: request, error: reqErr } = await db
      .from("ride_requests")
      .select(
        "id, student_name, phone, pickup, dropoff, passengers, status, assigned_driver_id, created_at, notes, pickup_area, fare_amount"
      )
      .eq("id", id)
      .single<RideRequestRow>();

    if (reqErr || !request) {
      return NextResponse.json({ error: reqErr?.message || "Not found" }, { status: 404 });
    }

    // 2) Load driver if assigned
    let driver: DriverRow | null = null;

    if (request.assigned_driver_id) {
      const { data: drv } = await db
        .from("drivers")
        .select("id, full_name, phone, car_model, car_color, plate_number")
        .eq("id", request.assigned_driver_id)
        .single<DriverRow>();

      if (drv) driver = drv;
    }

    return NextResponse.json({ request, driver });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}