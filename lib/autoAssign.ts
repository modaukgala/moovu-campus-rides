// lib/autoAssign.ts
import { supabaseAdmin } from "@/lib/supabaseServer";
import { sendWhatsAppText, waLink } from "@/lib/whatsapp";

type DriverRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  campus_area: string | null;
};

type RequestRow = {
  id: string;
  student_name: string | null;
  phone: string | null;
  pickup: string | null;
  dropoff: string | null;
  pickup_area: string | null;
  passengers: number | null;
  fare_amount: number | null; // cents
};

function normalize(s: string | null | undefined) {
  return (s ?? "").trim().toLowerCase();
}

function formatFare(cents: number | null) {
  if (typeof cents !== "number") return "—";
  return `R${(cents / 100).toFixed(2)}`;
}

export async function autoAssignPending({
  minAgeMs = 10_000,
  onlyRequestId,
}: {
  minAgeMs?: number;
  onlyRequestId?: string;
}) {
  const db = supabaseAdmin();
  const olderThanIso = new Date(Date.now() - minAgeMs).toISOString();

  // 1) Load pending requests
  let reqQuery = db
    .from("ride_requests")
    .select("id, student_name, phone, pickup, dropoff, pickup_area, passengers, fare_amount")
    .eq("status", "new")
    .is("assigned_driver_id", null)
    .lt("created_at", olderThanIso)
    .order("created_at", { ascending: true });

  // If you have this column, keep it. If not, remove these two lines:
  reqQuery = reqQuery.is("auto_assign_attempted_at", null);

  if (onlyRequestId) reqQuery = reqQuery.eq("id", onlyRequestId);

  const { data: requests, error: reqErr } = await reqQuery;

  if (reqErr) return { ok: false as const, error: reqErr.message };
  const reqs = (requests ?? []) as unknown as RequestRow[];
  if (reqs.length === 0) return { ok: true as const, checkedCount: 0, assignedCount: 0 };

  // 2) Load assignable drivers
  const { data: drivers, error: drvErr } = await db
    .from("drivers")
    .select("id, full_name, phone, campus_area")
    .eq("is_active", true)
    .eq("subscription_status", "active");

  if (drvErr) return { ok: false as const, error: drvErr.message };

  const drvs = (drivers ?? []) as unknown as DriverRow[];
  if (drvs.length === 0) return { ok: true as const, checkedCount: reqs.length, assignedCount: 0 };

  let assignedCount = 0;

  for (const r of reqs) {
    const preferred = normalize(r.pickup_area);

    const sameArea = preferred
      ? drvs.filter((d) => normalize(d.campus_area) === preferred)
      : [];

    const pool = sameArea.length > 0 ? sameArea : drvs;
    const chosen = pool[assignedCount % pool.length];

    // 3) Update request as assigned
    const { error: upErr } = await db
      .from("ride_requests")
      .update({
        assigned_driver_id: chosen.id,
        status: "assigned",
        // If you don't have this column, remove:
        auto_assign_attempted_at: new Date().toISOString(),
      })
      .eq("id", r.id);

    if (upErr) continue;
    assignedCount++;

    // 4) WhatsApp notify driver (best-effort)
    try {
      const driverPhone = chosen.phone ?? "";
      const studentPhone = r.phone ?? "";
      const studentName = r.student_name ?? "Student";
      const pickup = r.pickup ?? "—";
      const dropoff = r.dropoff ?? "—";
      const passengers = r.passengers ?? 1;
      const fare = formatFare(r.fare_amount);

      const msg =
        `🚗 MOOVU Campus Ride - Trip Assigned\n` +
        `Student: ${studentName}\n` +
        `Student Phone: ${studentPhone}\n` +
        `Pickup: ${pickup}\n` +
        `Drop-off: ${dropoff}\n` +
        `Passengers: ${passengers}\n` +
        `Fare: ${fare}\n\n` +
        `Tap to WhatsApp student: ${waLink(studentPhone, "Hi, I’m your MOOVU Campus Ride driver. I’ve been assigned your trip.")}\n` +
        `Tap to call student: tel:${studentPhone}`;

      await sendWhatsAppText(driverPhone, msg);
    } catch {
      // ignore WhatsApp failures so assignment still works
    }
  }

  return { ok: true as const, checkedCount: reqs.length, assignedCount };
}