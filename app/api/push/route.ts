import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health endpoint for push.
 * Real endpoint: /api/push/subscribe
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Push API is alive",
    endpoints: ["/api/push/subscribe"],
  });
}