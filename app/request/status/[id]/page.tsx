"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Driver = {
  id: string;
  full_name: string;
  phone: string;
  car_model: string | null;
  car_color: string | null;
  plate_number: string | null;
};

type RideRequest = {
  id: string;
  student_name: string;
  phone: string;
  pickup_area?: string | null;
  pickup: string;
  dropoff: string;
  passengers: number;
  status: "new" | "assigned" | "completed" | "cancelled";
  assigned_driver_id: string | null;
  created_at: string;
  notes?: string | null;

  fare_amount: number | null;
};

export default function RequestStatusPage({ params }: { params: { id: string } }) {
  const requestId = params.id;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [request, setRequest] = useState<RideRequest | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchingRef = useRef(false);

  const isDone = useMemo(
    () => request?.status === "completed" || request?.status === "cancelled",
    [request?.status]
  );

  // Stop polling once:
  // - request is completed/cancelled OR
  // - driver details are loaded (student can proceed)
  const shouldPoll = useMemo(() => {
    if (!request) return true;
    if (isDone) return false;
    if (request.status === "assigned" && driver) return false;
    return true;
  }, [request, isDone, driver]);

  async function fetchStatus() {
    if (fetchingRef.current) return; // prevent overlapping calls
    fetchingRef.current = true;

    try {
      setErr(null);

      const res = await fetch(`/api/ride-requests/${requestId}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        setErr(data?.error || "Could not load request.");
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      setRequest(data.request || null);
      setDriver(data.driver || null);
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
      fetchingRef.current = false;
    } catch {
      setErr("Network error. Please refresh.");
      setLoading(false);
      fetchingRef.current = false;
    }
  }

  useEffect(() => {
    fetchStatus();

    const t = setInterval(() => {
      if (shouldPoll) fetchStatus();
    }, 3000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, shouldPoll]);

  const statusText = request?.status || "new";

  return (
    <main className="container" style={{ paddingTop: 26, paddingBottom: 40 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <h1 style={{ margin: 0 }}>Ride Request Status</h1>
        <Link href="/" className="btnSecondary">
          Home
        </Link>
      </div>

      <p style={{ opacity: 0.75, marginTop: 8 }}>
        Request ID: <span style={{ opacity: 0.95, fontWeight: 800 }}>{requestId}</span>
        {lastUpdated && (
          <>
            {" "}
            • <span style={{ opacity: 0.75 }}>Updated: {lastUpdated}</span>
          </>
        )}
      </p>

      {loading && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Loading…</div>
          <div style={{ opacity: 0.78, marginTop: 6 }}>Please wait.</div>
        </div>
      )}

      {err && (
        <div className="card" style={{ marginTop: 12, borderColor: "rgba(227,28,61,0.45)" }}>
          <div style={{ fontWeight: 900 }}>Error</div>
          <div style={{ opacity: 0.78, marginTop: 6 }}>{err}</div>
          <button className="btnSecondary" style={{ marginTop: 12 }} onClick={fetchStatus} type="button">
            Retry
          </button>
        </div>
      )}

      {request && (
        <>
          <div className="card" style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>Status</div>
                <div style={{ marginTop: 6 }}>{statusPill(statusText)}</div>
              </div>

              <button className="btnSecondary" onClick={fetchStatus} type="button">
                Refresh
              </button>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.14)", margin: "12px 0" }} />

            {request.pickup_area && <InfoRow label="Pickup Area" value={String(request.pickup_area)} />}
            <InfoRow label="Pickup" value={request.pickup} />
            <InfoRow label="Drop-off" value={request.dropoff} />
            <InfoRow label="Passengers" value={String(request.passengers)} />
            <InfoRow label="Fare" value={`R${(request.fare_amount).toFixed(2)}`}/>
            <InfoRow label="Student" value={`${request.student_name} (${request.phone})`} />
          </div>

          {!driver && (request.status === "new" || request.status === "assigned") && (
            <div className="card" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>
                {request.status === "new" ? "Waiting for acceptance…" : "Driver assignment loading…"}
              </div>
              <div style={{ opacity: 0.78, marginTop: 6 }}>
                Keep this page open. It updates automatically every few seconds.
              </div>
            </div>
          )}

          {driver && (
            <div className="card" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Assigned Driver</div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.14)", margin: "12px 0" }} />

              <InfoRow label="Driver" value={driver.full_name} />
              <InfoRow label="Phone" value={driver.phone} />
              <InfoRow
                label="Car"
                value={[driver.car_model || "—", driver.car_color || "—"].filter(Boolean).join(" • ")}
              />
              <InfoRow label="Plate" value={driver.plate_number || "—"} />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                <a className="btnPrimary" style={{ width: "fit-content" }} href={`tel:${driver.phone}`}>
                  Call Driver
                </a>
                <a
                  className="btnSecondary"
                  style={{ width: "fit-content" }}
                  href={`https://wa.me/${driver.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp Driver
                </a>
              </div>
            </div>
          )}

          {request.status === "completed" && (
            <div className="card" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Trip Completed ✅</div>
              <div style={{ opacity: 0.78, marginTop: 6 }}>Thanks for using Campus Ride.</div>
            </div>
          )}

          {request.status === "cancelled" && (
            <div className="card" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Trip Cancelled</div>
              <div style={{ opacity: 0.78, marginTop: 6 }}>You can create a new request anytime.</div>
              <Link href="/request" className="btnPrimary" style={{ marginTop: 12, width: "fit-content" }}>
                Request Again
              </Link>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0" }}>
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span style={{ fontWeight: 800, textAlign: "right", maxWidth: 260, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

function statusPill(status: string) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    padding: "6px 12px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    letterSpacing: 0.6,
  };

  if (status === "assigned")
    return (
      <span style={{ ...base, borderColor: "rgba(245,179,1,0.45)", background: "rgba(245,179,1,0.14)" }}>
        ASSIGNED
      </span>
    );
  if (status === "completed")
    return (
      <span style={{ ...base, borderColor: "rgba(34,197,94,0.45)", background: "rgba(34,197,94,0.14)" }}>
        COMPLETED
      </span>
    );
  if (status === "cancelled")
    return (
      <span style={{ ...base, borderColor: "rgba(227,28,61,0.45)", background: "rgba(227,28,61,0.14)" }}>
        CANCELLED
      </span>
    );
  return (
    <span style={{ ...base, borderColor: "rgba(0,58,112,0.55)", background: "rgba(0,58,112,0.18)" }}>
      NEW
    </span>
  );
}