import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function checkAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  return key && key === process.env.ADMIN_KEY;
}

type AssignBody = {
  requestId: string;
  driverId: string;
};

export async function POST(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Partial<AssignBody> | null;
  if (!body?.requestId || !body?.driverId) {
    return NextResponse.json({ error: "requestId and driverId are required" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { error } = await db
    .from("ride_requests")
    .update({ assigned_driver_id: body.driverId, status: "assigned" })
    .eq("id", body.requestId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}