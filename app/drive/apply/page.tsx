"use client";

import { useState } from "react";
import Link from "next/link";

type CampusArea = "North" | "South" | "Arcadia" | "Soshanguve" | "Other" | "";

type FormState = {
  full_name: string;
  phone: string;
  student_number: string;
  campus_area: CampusArea;
  car_model: string;
  car_color: string;
  plate_number: string;
  notes: string;
};

const initial: FormState = {
  full_name: "",
  phone: "",
  student_number: "",
  campus_area: "",
  car_model: "",
  car_color: "",
  plate_number: "",
  notes: "",
};

export default function DriverApplyPage() {
  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function submit() {
    setErr(null);
    setOk(false);

    const fullName = form.full_name.trim();
    const phone = form.phone.trim();
    const studentNumber = form.student_number.trim();

    if (!fullName) return setErr("Please enter your full name.");
    if (!phone) return setErr("Please enter your phone number.");
    if (!studentNumber) return setErr("Please enter your student number.");

    // Optional but recommended: force campus selection (prevents blanks)
    if (!form.campus_area) return setErr("Please select the campus area you operate in.");

    setSubmitting(true);

    try {
      const res = await fetch("/api/driver-applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          student_number: studentNumber, // ✅ keep snake_case
          campus_area: form.campus_area || null,
          car_model: form.car_model.trim() || null,
          car_color: form.car_color.trim() || null,
          plate_number: form.plate_number.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (!res.ok || data?.ok === false) {
        setErr(typeof data?.error === "string" ? data.error : "Failed to submit application.");
        setSubmitting(false);
        return;
      }

      setOk(true);
      setForm(initial);
      setSubmitting(false);
    } catch {
      setErr("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: 26, paddingBottom: 40, maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Driver Application</h1>
        <Link href="/drive" className="btnSecondary">
          Back
        </Link>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Fill in your details</div>

        <div style={{ display: "grid", gap: 10 }}>
          <Input label="Full Name *" value={form.full_name} onChange={(v) => update("full_name", v)} />
          <Input label="Phone (WhatsApp) *" value={form.phone} onChange={(v) => update("phone", v)} />
          <Input label="Student Number *" value={form.student_number} onChange={(v) => update("student_number", v)} />

          {/* ✅ dropdown instead of typing */}
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>
              Campus Area (where you mostly operate) *
            </span>

            <select
              value={form.campus_area}
              onChange={(e) => update("campus_area", e.target.value as CampusArea)}
              style={{
                width: "100%",
                borderRadius: 12,
                padding: "10px 12px",
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "inherit",
                outline: "none",
              }}
            >
              <option value="">Select operating area…</option>
              <option value="North">TUT North / Pretoria North</option>
              <option value="South">TUT South Campus</option>
              <option value="Arcadia">TUT Arcadia Campus</option>
              <option value="Soshanguve">Soshanguve Area</option>
              <option value="Ga-Rankuwa">TUT Ga-Rankuwa</option>
            </select>
          </label>

          <Input label="Car Model" value={form.car_model} onChange={(v) => update("car_model", v)} />
          <Input label="Car Color" value={form.car_color} onChange={(v) => update("car_color", v)} />
          <Input label="Registration Plate" value={form.plate_number} onChange={(v) => update("plate_number", v)} />

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Notes (optional)</span>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={4}
              style={{
                width: "100%",
                borderRadius: 12,
                padding: "10px 12px",
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "inherit",
                outline: "none",
              }}
            />
          </label>

          {err && (
            <div style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(227,28,61,0.45)", background: "rgba(227,28,61,0.12)" }}>
              {err}
            </div>
          )}

          {ok && (
            <div style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(34,197,94,0.45)", background: "rgba(34,197,94,0.12)" }}>
              Application submitted ✅ The admin will review it.
            </div>
          )}

          <button className="btnPrimary" type="button" onClick={submit} disabled={submitting} style={{ width: "fit-content" }}>
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 13, opacity: 0.8 }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          borderRadius: 12,
          padding: "10px 12px",
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          color: "inherit",
          outline: "none",
        }}
      />
    </label>
  );
}