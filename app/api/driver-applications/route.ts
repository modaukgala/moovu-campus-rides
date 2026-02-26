import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

type Body = {
  full_name: string;
  phone: string;
  student_number: string;
  campus_area?: string | null;
  car_model?: string | null;
  car_color?: string | null;
  plate_number?: string | null;
  notes?: string | null;
};

function nonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Partial<Body> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    if (!nonEmpty(body.full_name)) return NextResponse.json({ error: "Full Name is required" }, { status: 400 });
    if (!nonEmpty(body.phone)) return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    if (!nonEmpty(body.student_number)) return NextResponse.json({ error: "Student Number is required" }, { status: 400 });

    const db = supabaseAdmin();

    const payload = {
      full_name: body.full_name.trim(),
      phone: body.phone.trim(),
      student_number: body.student_number.trim(),
      campus_area: typeof body.campus_area === "string" ? body.campus_area.trim() || null : null,
      car_model: typeof body.car_model === "string" ? body.car_model.trim() || null : null,
      car_color: typeof body.car_color === "string" ? body.car_color.trim() || null : null,
      plate_number: typeof body.plate_number === "string" ? body.plate_number.trim() || null : null,
      notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
      status: "new",
    };

    const { data, error } = await db.from("driver_applications").insert([payload]).select("*").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, application: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("driver_applications")
      .select("id, full_name, phone, student_number, campus_area, car_model, car_color, plate_number, notes, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, applications: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}