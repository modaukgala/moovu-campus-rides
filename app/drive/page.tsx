"use client";

import { useState } from "react";

export default function DrivePage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch("/api/driver-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: payload.full_name,
        phone: payload.phone,
        car_model: payload.car_model,
        car_color: payload.car_color,
        plate_number: payload.plate_number,
        campus: payload.campus,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setMsg(data?.error || "Failed to submit application.");
      return;
    }

    (e.target as HTMLFormElement).reset();
    setMsg("✅ Application submitted! Admin will review it.");
  }

  return (
    <main className="container" style={{ paddingTop: 30, paddingBottom: 40 }}>
      <h1 style={{ marginTop: 0 }}>Apply to Drive</h1>
      <p style={{ color: "#444" }}>Drivers apply here. Admin can also add drivers manually.</p>

      <form className="card" onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={label}>Full Name<input name="full_name" required style={input} /></label>
        <label style={label}>Phone<input name="phone" required style={input} /></label>
        <label style={label}>Car Model<input name="car_model" style={input} /></label>
        <label style={label}>Car Color<input name="car_color" style={input} /></label>
        <label style={label}>Plate Number<input name="plate_number" style={input} /></label>
        <label style={label}>Campus<input name="campus" style={input} placeholder="e.g. Soshanguve / Arcadia" /></label>

        <button className="btnPrimary" disabled={loading} type="submit">
          {loading ? "Submitting..." : "Submit Request"}
        </button>

        {msg && <p style={{ marginBottom: 0 }}>{msg}</p>}
      </form>
    </main>
  );
}

const wrap: React.CSSProperties = { maxWidth: 760, margin: "40px auto", padding: 16, fontFamily: "system-ui" };
const card: React.CSSProperties = { border: "1px solid #eee", borderRadius: 12, padding: 16, display: "grid", gap: 12 };
const label: React.CSSProperties = { display: "grid", gap: 6, fontSize: 14 };
const input: React.CSSProperties = { padding: 10, borderRadius: 10, border: "1px solid #ddd" };
const button: React.CSSProperties = { padding: 12, borderRadius: 10, border: "none", background: "black", color: "white" };