import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.full_name || !body?.phone) {
      return NextResponse.json({ error: "Full name and phone are required." }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { data, error } = await db
      .from("driver_applications")
      .insert([
        {
          full_name: String(body.full_name),
          phone: String(body.phone),
          car_model: body.car_model ? String(body.car_model) : null,
          car_color: body.car_color ? String(body.car_color) : null,
          plate_number: body.plate_number ? String(body.plate_number) : null,
          campus: body.campus ? String(body.campus) : null,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, application: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}