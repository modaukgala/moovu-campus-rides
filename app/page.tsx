import Link from "next/link";

export default function Home() {
  return (
    <main>
      <header className="container" style={{ paddingTop: 22, paddingBottom: 10 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                letterSpacing: 1,
                background: "linear-gradient(135deg, var(--tut-blue), var(--tut-red))",
              }}
            >
             
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900 }}>MOOVU CAMPUS RIDES</div>
              <div style={{ fontSize: 13, opacity: 0.75 }}>  Safe • Fast • Trusted</div>
            </div>
          </div>

          {/* No Admin link here intentionally */}
        </div>
      </header>

      <section className="container grid2" style={{ paddingTop: 10, paddingBottom: 18 }}>
        <div style={{ padding: "10px 0" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.14)",
              fontSize: 13,
              width: "fit-content",
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--tut-red)" }} />
            For University Students
          </div>

          <h1 style={{ fontSize: 44, lineHeight: 1.05, margin: "14px 0 10px 0", letterSpacing: -1 }}>
            Request a ride between campuses, malls & nearby areas. 
          </h1>

          <p style={{ fontSize: 16, opacity: 0.82, maxWidth: 620, lineHeight: 1.55 }}>
            Request. Get A Ride.
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <Link href="/request" className="btnPrimary">
              Request a Ride
            </Link>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            {["Student-focused", "Clear Pickup Points", "Fixed-Pricing"].map((t) => (
              <div
                key={t}
                style={{
                  padding: "8px 10px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  fontSize: 13,
                  opacity: 0.92,
                }}
              >
                ✅ {t}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <div className="card">
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Live Example</div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.14)", margin: "10px 0 12px 0" }} />
            <Row k="Pickup" v="TUT North Campus" />
            <Row k="Drop-off" v="Soshanguve Crossing" />
            <Row k="Status" v={<span style={statusPill}>Assigned</span>} />
            <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 14, textAlign: "center", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", fontWeight: 900 }}>
              Driver on the way
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MiniStat top="1–5 min" bottom="Typical assignment time" />
            <MiniStat top="6am-10pm" bottom="Requests accepted" />
            <MiniStat top="Safer" bottom="Student-friendly network" />
            <MiniStat top="Simple" bottom="One-click request" />
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 34 }}>
        <h2 style={{ fontSize: 22, margin: "12px 0 14px 0" }}>How it works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <Step n="1" title="Request" text="Enter Pickup, Destination, Passengers and Notes." />
          <Step n="2" title="Price" text="Get Fixed Price Calculated For You" />
          <Step n="3" title="Ride" text="Pay The Driver Cash/Transfer After The Trip" />
        </div>

        {/* Apply to Drive at the bottom */}
        <div className="card" style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Are you a driver?</div>
          <div style={{ opacity: 0.78, lineHeight: 1.5 }}>
            Apply privately — your application will be reviewed before activation.
          </div>
          <Link href="/drive" className="btnSecondary">
            Apply to Drive
          </Link>
        </div>

        <div style={{ opacity: 0.65, fontSize: 13, marginTop: 16 }}>
          Admin access is private (not shown publicly).
        </div>
      </section>
    </main>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14 }}>
      <span style={{ opacity: 0.7 }}>{k}</span>
      <span style={{ fontWeight: 800 }}>{v}</span>
    </div>
  );
}

function MiniStat({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div className="card" style={{ boxShadow: "none" }}>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{top}</div>
      <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>{bottom}</div>
    </div>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="card" style={{ boxShadow: "none" }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          fontWeight: 900,
          background: "rgba(0,58,112,0.22)",
          border: "1px solid rgba(0,58,112,0.38)",
          marginBottom: 10,
        }}
      >
        {n}
      </div>
      <div style={{ fontWeight: 900, marginBottom: 6 }}>{title}</div>
      <div style={{ opacity: 0.78, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

const statusPill: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 999,
  background: "rgba(227,28,61,0.18)",
  border: "1px solid rgba(227,28,61,0.35)",
  color: "rgba(255,220,228,0.95)",
  fontWeight: 900,
  fontSize: 12,
};