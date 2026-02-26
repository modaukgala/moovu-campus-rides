// app/api/admin/assign/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { sendWhatsAppText } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const requestId = body?.requestId?.trim();
  const driverId = body?.driverId?.trim();

  if (!requestId || !driverId) {
    return NextResponse.json({ error: "requestId and driverId are required" }, { status: 400 });
  }

  const db = supabaseAdmin();

  // 1) Assign driver
  const { data: updatedReq, error: upErr } = await db
    .from("ride_requests")
    .update({
      assigned_driver_id: driverId,
      status: "assigned",
    })
    .eq("id", requestId)
    .select("id, student_name, phone, pickup, dropoff, passengers, driver_notified_at, assigned_driver_id")
    .single();

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  if (!updatedReq) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  // 2) Fetch driver details
  const { data: driver, error: drvErr } = await db
    .from("drivers")
    .select("id, full_name, phone, car_model, car_color, plate_number")
    .eq("id", driverId)
    .single();

  if (drvErr) return NextResponse.json({ error: drvErr.message }, { status: 500 });

  // 3) WhatsApp notify driver (only once)
  try {
    if (!updatedReq.driver_notified_at && driver?.phone) {
      const studentPhoneDigits = String(updatedReq.phone || "").replace(/\D/g, "");
      const driverMessage =
        `🚗 MOOVU Campus Ride Assigned\n\n` +
        `Student: ${updatedReq.student_name}\n` +
        `Student Phone: ${updatedReq.phone}\n` +
        `Trip: ${updatedReq.pickup} → ${updatedReq.dropoff}\n` +
        `Passengers: ${updatedReq.passengers}\n\n` +
        `WhatsApp student: https://wa.me/${studentPhoneDigits}\n` +
        `Call student: tel:${updatedReq.phone}\n\n` +
        `Request ID: ${updatedReq.id}`;

      const sent = await sendWhatsAppText(driver.phone, driverMessage);

      if (sent.ok) {
        await db
          .from("ride_requests")
          .update({ driver_notified_at: new Date().toISOString() })
          .eq("id", updatedReq.id);
      }
    }
  } catch {
    // Don't fail assignment if WhatsApp fails
  }

  return NextResponse.json({ ok: true });
}