"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AREAS, getFareCents, formatZAR, type Area } from "@/lib/pricing";

export default function RequestRidePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [pickupArea, setPickupArea] = useState<Area>("TUT North Campus");
  const [dropoffArea, setDropoffArea] = useState<Area>("TUT South Campus");

  const fareCents = useMemo(() => getFareCents(pickupArea, dropoffArea), [pickupArea, dropoffArea]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    if (fareCents === null) {
      setMsg("❌ This route has no fixed price yet. Please choose another destination.");
      return;
    }

    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const body = {
      student_name: String(payload.student_name || "").trim(),
      phone: String(payload.phone || "").trim(),
      pickup_area: pickupArea,
      dropoff_area: dropoffArea,

      // Keep compatibility with existing DB fields
      pickup: pickupArea,
      dropoff: dropoffArea,

      passengers: Number(payload.passengers || 1),
      notes: String(payload.notes || "").trim(),
    };

    const res = await fetch("/api/ride-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setMsg(data?.error || "Failed to submit request.");
      return;
    }

    const requestId = data?.request?.id;
    if (requestId) {
      router.push(`/request/status/${requestId}`);
      return;
    }

    setMsg("✅ Request submitted! Please wait for assignment.");
  }

  return (
    <main className="container" style={{ paddingTop: 26, paddingBottom: 40 }}>
      <h1 style={{ marginTop: 0 }}>Request a Ride</h1>
      <p style={{ opacity: 0.75, marginTop: 6 }}>One-way fixed fares between areas.</p>

      <form className="card" onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 620 }}>
        <label className="label">
          Name
          <input className="input" name="student_name" required />
        </label>

        <label className="label">
          Phone Number
          <input className="input" name="phone" required />
        </label>

        <label className="label">
          Pickup Area
          <select
            className="input"
            name="pickup_area"
            value={pickupArea}
            onChange={(e) => setPickupArea(e.target.value as Area)}
          >
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="label">
          Destination Area
          <select
            className="input"
            name="dropoff_area"
            value={dropoffArea}
            onChange={(e) => setDropoffArea(e.target.value as Area)}
          >
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <div className="card" style={{ boxShadow: "none", padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontWeight: 900 }}>Trip Price</div>
            <div style={{ fontWeight: 900 }}>
              {fareCents === null ? "—" : formatZAR(fareCents)}
            </div>
          </div>
          {fareCents === null && (
            <div style={{ opacity: 0.75, marginTop: 6, fontSize: 13 }}>
              This route is not priced yet (edit <b>lib/pricing.ts</b>).
            </div>
          )}
        </div>

        <label className="label">
          Passengers
          <input className="input" name="passengers" type="number" min={1} max={3} defaultValue={1} />
        </label>

        <label className="label">
          Notes (optional)
          <textarea className="input" name="notes" rows={3} style={{ resize: "vertical" }} />
        </label>

        <button className="btnPrimary" disabled={loading} type="submit">
          {loading ? "Submitting..." : "Submit Request"}
        </button>

        {msg && <p style={{ margin: 0, opacity: 0.9 }}>{msg}</p>}
      </form>
    </main>
  );
}