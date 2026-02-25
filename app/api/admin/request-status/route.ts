import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function checkAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  return key && key === process.env.ADMIN_KEY;
}

const allowed = new Set(["new", "assigned", "completed", "cancelled"] as const);
type AllowedStatus = (typeof allowed extends Set<infer T> ? T : never) & string;

type Body = {
  requestId: string;
  status: AllowedStatus;
};

export async function POST(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Partial<Body> | null;
  if (!body?.requestId || !body?.status || !allowed.has(body.status)) {
    return NextResponse.json({ error: "Invalid requestId/status" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { error } = await db.from("ride_requests").update({ status: body.status }).eq("id", body.requestId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}