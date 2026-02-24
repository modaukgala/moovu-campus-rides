import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(
  _req: Request,
  ctx: { params: { id: string } }
) {
  try {
    const id = String(ctx?.params?.id || "").trim();
    if (!id) return jsonError("Missing request id", 400);

    const db = supabaseAdmin();

    // 1) Load request
    const { data: request, error: reqErr } = await db
      .from("ride_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (reqErr || !request) {
      // Supabase can return error for .single() if no rows
      return jsonError("Request not found", 404);
    }

    // 2) If assigned, load driver
    let driver: any = null;

    if (request.assigned_driver_id) {
      const { data: drv, error: drvErr } = await db
        .from("drivers")
        .select("id, full_name, phone, car_model, car_color, plate_number")
        .eq("id", request.assigned_driver_id)
        .single();

      if (!drvErr && drv) driver = drv;
    }

    return NextResponse.json({ ok: true, request, driver }, { status: 200 });
  } catch {
    return jsonError("Server error", 500);
  }
}