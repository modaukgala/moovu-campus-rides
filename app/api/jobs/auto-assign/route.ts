import { NextResponse } from "next/server";
import { autoAssignPending } from "@/lib/autoAssign";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorizedJob(req: Request) {
  const key = req.headers.get("x-job-key");
  return !!key && key === process.env.JOB_KEY;
}

export async function POST(req: Request) {
  if (!isAuthorizedJob(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized job" }, { status: 401 });
  }

  const result = await autoAssignPending({ minAgeMs: 30_000 });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 500 });

  return NextResponse.json(result);
}