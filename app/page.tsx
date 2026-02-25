import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main>
      {/* No top bar/header anymore */}

      <section className="container grid2" style={{ paddingTop: 28, paddingBottom: 18 }}>
        <div style={{ padding: "10px 0" }}>
          {/* LOGO + TITLE (replaces CR block) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              marginBottom: 18,
            }}
          >
            <Image
              src="/Moovu-Logo-White.jpg"
              alt="MOOVU"
              width={320}
              height={160}
              priority
              style={{
                width: "220px",
                height: "auto",
                objectFit: "contain",
                filter:
                  "drop-shadow(0 10px 26px rgba(0,0,0,0.55)) drop-shadow(0 0 18px rgba(227,28,61,0.18))",
              }}
            />

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 40, fontWeight: 950, letterSpacing: 0.6 }}>
                MOOVU CAMPUS RIDES
              </div>
              <div style={{ fontSize: 20, opacity: 0.75 }}>Safe • Fast • Trusted</div>
            </div>
          </div>

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
            FOR UNIVERSITY STUDENTS
          </div>

          <h1 style={{ fontSize: 44, lineHeight: 1.05, margin: "14px 0 10px 0", letterSpacing: -1 }}>
            Request a ride between campuses, malls & nearby areas.
          </h1>

          <p style={{ fontSize: 16, opacity: 0.82, maxWidth: 620, lineHeight: 1.55 }}>
            Quick requests. Fixed pricing. Track your ride status in real-time.
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <Link href="/request" className="btnPrimary">
              REQUEST A RIDE
            </Link>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            {["Student-focused", "Clear Pickup Points", "Fixed-Pricing", "Reliable"].map((t) => (
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
            <div
              style={{
                marginTop: 12,
                padding: "12px 14px",
                borderRadius: 14,
                textAlign: "center",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                fontWeight: 900,
              }}
            >
              Driver on the way
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MiniStat top="1–5 min" bottom="Trip Assignment Time" />
            <MiniStat top="06h00-22h00" bottom="Operating Hours" />
            <MiniStat top="SAFE" bottom="Student-Friendly Network" />
            <MiniStat top="SIMPLE" bottom="One-Click Request" />
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 34 }}>
        <h2 style={{ fontSize: 22, margin: "12px 0 14px 0" }}>How it works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <Step n="1" title="Request" text="Open MOOVU and Click on REQUEST A RIDE" />
          <Step n="2" title="Price" text="Choose your Destination and See Your Fixed Price" />
          <Step n="3" title="Ride" text="Ride Safe and Pay Cash/Transfer to the Driver" />
        </div>

        <div className="card" style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Are you a driver?</div>
          <div style={{ opacity: 0.78, lineHeight: 1.5 }}>
            Apply privately — your application will be reviewed before activation.
          </div>
          <Link href="/drive" className="btnSecondary">
            Apply to Drive
          </Link>
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