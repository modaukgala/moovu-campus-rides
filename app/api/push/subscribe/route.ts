import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

type SubscribeBody = {
  subscription: PushSubscriptionJSON;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as SubscribeBody | null;
    if (!body?.subscription) return NextResponse.json({ error: "Missing subscription" }, { status: 400 });

    const db = supabaseAdmin();

    const { error } = await db.from("push_subscriptions").insert([
      {
        user_type: "admin",
        subscription: body.subscription,
      },
    ]);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}