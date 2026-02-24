"use client";

import { useEffect, useMemo, useState } from "react";

type Driver = {
  id: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  subscription_status: string;
  campus_area?: string | null;
};

type RideRequest = {
  id: string;
  student_name: string;
  phone: string;
  pickup: string;
  dropoff: string;
  passengers: number;
  status: string;
  assigned_driver_id: string | null;
  created_at: string;

  fare_amount: number | null;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Push UI state
  const [canPush, setCanPush] = useState(false);
  const [pushState, setPushState] = useState<"unknown" | "enabled" | "blocked" | "not_supported">("unknown");

  // Load stored key
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
    if (!adminKey.trim()) {
      setMsg("Enter admin key first.");
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const [dRes, rRes] = await Promise.all([
        fetch("/api/admin/drivers", { headers: { "x-admin-key": adminKey } }),
        fetch("/api/admin/ride-requests", { headers: { "x-admin-key": adminKey } }),
      ]);

      const dJson = await dRes.json().catch(() => ({}));
      const rJson = await rRes.json().catch(() => ({}));

      if (!dRes.ok) {
        setLoading(false);
        setMsg(dJson?.error || "Failed loading drivers");
        return;
      }
      if (!rRes.ok) {
        setLoading(false);
        setMsg(rJson?.error || "Failed loading requests");
        return;
      }

      setDrivers(dJson.drivers || []);
      setRequests(rJson.requests || []);
      setLoading(false);
    } catch {
      setLoading(false);
      setMsg("Network error loading data.");
    }
  }

  async function addDriver(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    if (!adminKey.trim()) {
      setMsg("Enter admin key first.");
      return;
    }

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch("/api/admin/drivers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify({
        full_name: payload.full_name,
        phone: payload.phone,
        car_model: payload.car_model,
        car_color: payload.car_color,
        plate_number: payload.plate_number,
        campus: payload.campus,
        campus_area: payload.campus_area, // ✅ IMPORTANT: send campus_area
        is_active: payload.is_active === "on",
        subscription_status: payload.subscription_status || "active",
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data?.error || "Failed adding driver");
      return;
    }

    (e.target as HTMLFormElement).reset();
    setMsg("✅ Driver added");
    loadAll();
  }

  async function assignDriver(requestId: string, driverId: string) {
    setMsg(null);

    const res = await fetch("/api/admin/assign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify({ requestId, driverId }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data?.error || "Failed assigning driver");
      return;
    }

    setMsg("✅ Driver assigned");
    loadAll();
  }

  async function setStatus(requestId: string, status: string) {
    setMsg(null);

    const res = await fetch("/api/admin/request-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify({ requestId, status }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data?.error || "Failed updating status");
      return;
    }

    setMsg(`✅ Status updated: ${status}`);
    loadAll();
  }

  // -------------------- PUSH: status check --------------------
  useEffect(() => {
    // only check in browser
    const supported = pushSupported();
    setCanPush(supported);

    if (!supported) {
      setPushState("not_supported");
      return;
    }

    // If permission already blocked, show clearly
    if (Notification.permission === "denied") {
      setPushState("blocked");
      return;
    }

    // We can’t know if subscribed without checking SW
    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
          setPushState("unknown");
          return;
        }
        const sub = await reg.pushManager.getSubscription();
        setPushState(sub ? "enabled" : "unknown");
      } catch {
        setPushState("unknown");
      }
    })();
  }, []);

  // ✅ PUSH: Enable push notifications for this admin device
  async function enablePush() {
    try {
      setMsg(null);

      if (!pushSupported()) {
        setMsg("Push not supported on this browser/device.");
        setPushState("not_supported");
        return;
      }

      if (Notification.permission === "denied") {
        setMsg("Notifications are blocked for this site. Allow them in browser settings.");
        setPushState("blocked");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setMsg("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env.local (restart server after adding).");
        return;
      }

      // Register SW (wait until ready)
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Ask permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMsg("Notification permission not granted.");
        if (permission === "denied") setPushState("blocked");
        return;
      }

      // If already subscribed, reuse it
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      // Save subscription in DB
      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
      });

      const saveJson = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok || saveJson?.ok === false) {
        setMsg(saveJson?.error || "Failed saving push subscription.");
        return;
      }

      setPushState("enabled");
      setMsg("✅ Push notifications enabled on this device.");
    } catch (e: any) {
      setMsg(e?.message || "Failed to enable push notifications.");
    }
  }

  // When authed becomes true, load everything
  useEffect(() => {
    if (authed) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  // -------------------- LOGIN VIEW --------------------
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

  // -------------------- DASHBOARD VIEW --------------------
  return (
    <main className="container" style={{ paddingTop: 30, paddingBottom: 40 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Admin Dashboard</h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {/* ✅ PUSH BUTTON (only show if supported) */}
          {canPush && (
            <button className="btnSecondary" type="button" onClick={enablePush} disabled={pushState === "enabled"}>
              {pushState === "enabled" ? "Push Enabled" : "Enable Push"}
            </button>
          )}

          <button className="btnSecondary" type="button" disabled={loading} onClick={loadAll}>
            {loading ? "Loading..." : "Refresh"}
          </button>

          <button className="btnSecondary" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {pushState === "blocked" && (
        <div className="card" style={{ marginTop: 12, borderColor: "rgba(245,179,1,0.45)" }}>
          <div style={{ fontWeight: 900 }}>Notifications are blocked</div>
          <div style={{ opacity: 0.8, marginTop: 6 }}>
            Allow notifications for this site in your browser settings, then reload this page.
          </div>
        </div>
      )}

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        {/* Add Driver */}
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

        {/* Drivers list */}
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
                    {d.campus_area && <div style={{ opacity: 0.65, fontSize: 12 }}>Area: {d.campus_area}</div>}
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

      {/* Ride Requests */}
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
                      {r.student_name}{" "}
                      <span style={{ fontWeight: 500, opacity: 0.75 }}>({r.phone})</span>
                    </div>
                    <div style={{ opacity: 0.9, marginTop: 4 }}>
                      {r.pickup} → {r.dropoff}
                    </div>
                    <div style={{ opacity: 0.75, fontSize: 13, marginTop: 6 }}>
                      passengers: {r.passengers} • fare: <b>R{(r.fare_amount / 100).toFixed(2)}</b> • status: <b>{r.status}</b>
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

      {/* Mobile responsiveness */}
      <style jsx>{`
        @media (max-width: 920px) {
          section[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}