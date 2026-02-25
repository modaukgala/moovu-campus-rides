import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Simple health endpoint for jobs.
 * (Your real job endpoint is /api/jobs/auto-assign)
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Jobs API is alive",
    endpoints: ["/api/jobs/auto-assign"],
  });
}