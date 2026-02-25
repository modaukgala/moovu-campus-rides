"use client";

import { useEffect, useMemo, useState } from "react";

type Driver = {
  id: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  subscription_status: "active" | "inactive" | string;
};

type RideRequest = {
  id: string;
  student_name: string;
  phone: string;
  pickup: string;
  dropoff: string;
  passengers: number;
  status: "new" | "assigned" | "completed" | "cancelled" | string;
  assigned_driver_id: string | null;
  created_at: string;
  fare_amount?: number | null;
};

type DriversResponse = { drivers: Driver[]; error?: string };
type RequestsResponse = { requests: RideRequest[]; error?: string };
type OkResponse = { ok: true } | { error: string };

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ADMIN_KEY");
    if (stored) setAdminKey(stored);
  }, []);

  const activeDrivers = useMemo(
    () => drivers.filter((d) => d.is_active && d.subscription_status === "active"),
    [drivers]
  );

  function logout() {
    localStorage.removeItem("ADMIN_KEY");
    setAdminKey("");
    setAuthed(false);
    setDrivers([]);
    setRequests([]);
    setMsg(null);
  }

  async function loadAll() {
    const k = adminKey.trim();
    if (!k) {
      setMsg("Enter admin key first.");
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const [dRes, rRes] = await Promise.all([
        fetch("/api/admin/drivers", { headers: { "x-admin-key": k } }),
        fetch("/api/admin/ride-requests", { headers: { "x-admin-key": k } }),
      ]);

      const dJson = (await dRes.json().catch(() => ({ drivers: [] }))) as DriversResponse;
      const rJson = (await rRes.json().catch(() => ({ requests: [] }))) as RequestsResponse;

      if (!dRes.ok) {
        setMsg(dJson?.error || "Failed loading drivers");
        setLoading(false);
        return;
      }
      if (!rRes.ok) {
        setMsg(rJson?.error || "Failed loading requests");
        setLoading(false);
        return;
      }

      setDrivers(dJson.drivers || []);
      setRequests(rJson.requests || []);
      setLoading(false);
    } catch {
      setMsg("Network error loading data.");
      setLoading(false);
    }
  }

  async function addDriver(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    const k = adminKey.trim();
    if (!k) {
      setMsg("Enter admin key first.");
      return;
    }

    const form = new FormData(e.currentTarget);

    const full_name = String(form.get("full_name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const car_model = String(form.get("car_model") ?? "").trim();
    const car_color = String(form.get("car_color") ?? "").trim();
    const plate_number = String(form.get("plate_number") ?? "").trim();
    const campus = String(form.get("campus") ?? "").trim();
    const campus_area = String(form.get("campus_area") ?? "").trim();
    const is_active = form.get("is_active") === "on";
    const subscription_status = String(form.get("subscription_status") ?? "active");

    const res = await fetch("/api/admin/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": k },
      body: JSON.stringify({
        full_name,
        phone,
        car_model: car_model || null,
        car_color: car_color || null,
        plate_number: plate_number || null,
        campus: campus || null,
        campus_area: campus_area || null,
        is_active,
        subscription_status,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as OkResponse;

    if (!res.ok) {
      setMsg("error" in data ? data.error : "Failed adding driver");
      return;
    }

    e.currentTarget.reset();
    setMsg("✅ Driver added");
    loadAll();
  }

  async function assignDriver(requestId: string, driverId: string) {
    setMsg(null);

    const res = await fetch("/api/admin/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey.trim() },
      body: JSON.stringify({ requestId, driverId }),
    });

    const data = (await res.json().catch(() => ({}))) as OkResponse;

    if (!res.ok) {
      setMsg("error" in data ? data.error : "Failed assigning driver");
      return;
    }

    setMsg("✅ Driver assigned");
    loadAll();
  }

  async function setStatus(requestId: string, status: "assigned" | "completed" | "cancelled") {
    setMsg(null);

    const res = await fetch("/api/admin/request-status", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey.trim() },
      body: JSON.stringify({ requestId, status }),
    });

    const data = (await res.json().catch(() => ({}))) as OkResponse;

    if (!res.ok) {
      setMsg("error" in data ? data.error : "Failed updating status");
      return;
    }

    setMsg(`✅ Status updated: ${status}`);
    loadAll();
  }

  async function enablePush() {
    try {
      setMsg(null);

      if (!("serviceWorker" in navigator)) {
        setMsg("Push not supported on this device/browser.");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMsg("Notification permission not granted.");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setMsg("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY in environment.");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      const saveJson = (await saveRes.json().catch(() => ({}))) as OkResponse;
      if (!saveRes.ok) {
        setMsg("error" in saveJson ? saveJson.error : "Failed saving push subscription.");
        return;
      }

      setMsg("✅ Push enabled on this device.");
    } catch {
      setMsg("Failed to enable push.");
    }
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
    return output;
  }

  useEffect(() => {
    if (authed) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  if (!authed) {
    return (
      <main className="container" style={{ paddingTop: 30, paddingBottom: 40 }}>
        <h1 style={{ marginTop: 0 }}>Admin</h1>
        <p style={{ opacity: 0.75 }}>Enter admin key to continue.</p>

        <div className="card" style={{ maxWidth: 520, display: "grid", gap: 10 }}>
          <label className="label">
            Admin Key
            <input
              className="input"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin key"
            />
          </label>

          <button
            className="btnPrimary"
            type="button"
            onClick={() => {
              const k = adminKey.trim();
              if (!k) {
                setMsg("Enter admin key first.");
                return;
              }
              localStorage.setItem("ADMIN_KEY", k);
              setAuthed(true);
            }}
          >
            Enter Admin Portal
          </button>

          {msg && <p style={{ margin: 0 }}>{msg}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: 30, paddingBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ marginTop: 0 }}>Admin Dashboard</h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btnSecondary" type="button" onClick={enablePush}>
            Enable Push
          </button>

          <button className="btnSecondary" type="button" disabled={loading} onClick={loadAll}>
            {loading ? "Loading..." : "Refresh"}
          </button>

          <button className="btnSecondary" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}

      <section className="grid2" style={{ marginTop: 16 }}>
        <div className="card" style={{ boxShadow: "none" }}>
          <h3 style={{ marginTop: 0 }}>Add Driver (Manual)</h3>

          <form onSubmit={addDriver} style={{ display: "grid", gap: 10 }}>
            <input className="input" name="full_name" required placeholder="Full name" />
            <input className="input" name="phone" required placeholder="Phone" />
            <input className="input" name="car_model" placeholder="Car model" />
            <input className="input" name="car_color" placeholder="Car color" />
            <input className="input" name="plate_number" placeholder="Plate number" />
            <input className="input" name="campus" placeholder="Campus" />

            <select className="input" name="campus_area" defaultValue="North">
              <option value="North">North Campus</option>
              <option value="South">South Campus</option>
              <option value="Arcadia">Arcadia Campus</option>
              <option value="Soshanguve">Soshanguve Campus</option>
              <option value="Other">Other</option>
            </select>

            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, opacity: 0.9 }}>
              <input type="checkbox" name="is_active" defaultChecked /> Active
            </label>

            <select className="input" name="subscription_status" defaultValue="active">
              <option value="active">subscription: active</option>
              <option value="inactive">subscription: inactive</option>
            </select>

            <button className="btnPrimary" type="submit">
              Add Driver
            </button>
          </form>

          <p style={{ opacity: 0.7, marginBottom: 0, fontSize: 13, marginTop: 10 }}>
            Only drivers who are <b>active</b> + subscription <b>active</b> appear for assignment.
          </p>
        </div>

        <div className="card" style={{ boxShadow: "none" }}>
          <h3 style={{ marginTop: 0 }}>Drivers</h3>

          <div style={{ display: "grid", gap: 10 }}>
            {drivers.length === 0 ? (
              <p style={{ opacity: 0.7 }}>No drivers yet.</p>
            ) : (
              drivers.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800 }}>{d.full_name}</div>
                    <div style={{ opacity: 0.75, fontSize: 13 }}>{d.phone}</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 13, opacity: 0.85 }}>
                    <div>{d.is_active ? "active" : "inactive"}</div>
                    <div>{d.subscription_status}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>
            Assignable drivers: <b>{activeDrivers.length}</b>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <div className="card" style={{ boxShadow: "none" }}>
          <h3 style={{ marginTop: 0 }}>Ride Requests</h3>

          {requests.length === 0 ? (
            <p style={{ opacity: 0.7 }}>No requests found.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {requests.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    padding: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.04)",
                    alignItems: "stretch",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ fontWeight: 900 }}>
                      {r.student_name} <span style={{ fontWeight: 500, opacity: 0.75 }}>({r.phone})</span>
                    </div>
                    <div style={{ opacity: 0.9, marginTop: 4 }}>
                      {r.pickup} → {r.dropoff}
                    </div>
                    <div style={{ opacity: 0.75, fontSize: 13, marginTop: 6 }}>
                      passengers: {r.passengers} • status: <b>{r.status}</b>
                      {typeof r.fare_amount === "number" ? <> • fare: <b>R{(r.fare_amount / 100).toFixed(2)}</b></> : null}
                    </div>
                  </div>

                  <div style={{ width: 280, display: "grid", gap: 8, minWidth: 260 }}>
                    <select
                      className="input"
                      value={r.assigned_driver_id || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) assignDriver(r.id, v);
                      }}
                    >
                      <option value="">Assign driver…</option>
                      {activeDrivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.full_name}
                        </option>
                      ))}
                    </select>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btnSecondary" type="button" onClick={() => setStatus(r.id, "assigned")} style={{ flex: 1 }}>
                        Assigned
                      </button>
                      <button className="btnSecondary" type="button" onClick={() => setStatus(r.id, "completed")} style={{ flex: 1 }}>
                        Completed
                      </button>
                      <button className="btnSecondary" type="button" onClick={() => setStatus(r.id, "cancelled")} style={{ flex: 1 }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}