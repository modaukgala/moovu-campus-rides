"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AppRow = {
  id: string;
  full_name: string;
  phone: string;
  student_number: string
  campus_area: string | null;
  car_model: string | null;
  car_color: string | null;
  plate_number: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

export default function AdminDriverApplicationsPage() {
  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [apps, setApps] = useState<AppRow[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("ADMIN_KEY") || "";
    setAdminKey(stored);
  }, []);

  async function load() {
    const k = adminKey.trim();
    if (!k) {
      setMsg("Admin key missing. Go back and login again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/admin/driver-applications", {
        headers: { "x-admin-key": k },
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data?.error || "Failed to load applications");
        setLoading(false);
        return;
      }

      setApps(Array.isArray(data?.applications) ? data.applications : []);
      setLoading(false);
    } catch {
      setMsg("Network error loading applications.");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (adminKey) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

  return (
    <main className="container" style={{ paddingTop: 30, paddingBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Driver Applications</h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btnSecondary" href="/admin">
            Back to Admin
          </Link>
          <button className="btnSecondary" type="button" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}

      <div className="card" style={{ marginTop: 16, boxShadow: "none" }}>
        {loading ? (
          <p style={{ opacity: 0.75 }}>Loading…</p>
        ) : apps.length === 0 ? (
          <p style={{ opacity: 0.75 }}>No applications yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {apps.map((a) => (
              <div
                key={a.id}
                style={{
                  display: "grid",
                  gap: 6,
                  padding: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 900 }}>{a.full_name}</div>
                  <div style={{ opacity: 0.7, fontSize: 13 }}>{new Date(a.created_at).toLocaleString()}</div>
                </div>

                <Row k="Phone" v={a.phone} />
                <Row k="Student Number" v={a.student_number} />
                <Row k="Campus Area" v={a.campus_area || "—"} />
                <Row k="Car" v={[a.car_model, a.car_color].filter(Boolean).join(" • ") || "—"} />
                <Row k="Plate" v={a.plate_number || "—"} />
                <Row k="Notes" v={a.notes || "—"} />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                  <a className="btnSecondary" href={`tel:${a.phone}`} style={{ width: "fit-content" }}>
                    Call
                  </a>
                  <a
                    className="btnSecondary"
                    href={`https://wa.me/${a.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ width: "fit-content" }}
                  >
                    WhatsApp
                  </a>
                </div>

                <div style={{ opacity: 0.7, fontSize: 13 }}>
                  Tip: Copy these details and add them using **Add Driver (Manual)** on the admin page.
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ opacity: 0.7 }}>{k}</span>
      <span style={{ fontWeight: 800, textAlign: "right" }}>{v}</span>
    </div>
  );
}