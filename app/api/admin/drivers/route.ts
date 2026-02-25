import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function checkAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  return key && key === process.env.ADMIN_KEY;
}

type CreateDriverBody = {
  full_name: string;
  phone: string;
  car_model?: string | null;
  car_color?: string | null;
  plate_number?: string | null;
  campus?: string | null;
  campus_area?: string | null;
  is_active?: boolean;
  subscription_status?: "active" | "inactive";
};

export async function GET(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = supabaseAdmin();
  const { data, error } = await db.from("drivers").select("*").order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ drivers: data || [] });
}

export async function POST(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Partial<CreateDriverBody> | null;
  if (!body?.full_name || !body?.phone) {
    return NextResponse.json({ error: "full_name and phone are required" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("drivers")
    .insert([
      {
        full_name: String(body.full_name),
        phone: String(body.phone),
        car_model: body.car_model ? String(body.car_model) : null,
        car_color: body.car_color ? String(body.car_color) : null,
        plate_number: body.plate_number ? String(body.plate_number) : null,
        campus: body.campus ? String(body.campus) : null,
        campus_area: body.campus_area ? String(body.campus_area) : null,
        is_active: body.is_active ?? true,
        subscription_status: body.subscription_status ?? "inactive",
      },
    ])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, driver: data });
}