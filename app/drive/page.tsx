export default function DrivePage() {
  return (
    <main className="container" style={{ paddingTop: 26, paddingBottom: 40 }}>
      <div className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ marginTop: 0 }}>Drive with Campus Ride</h1>
        <p style={{ opacity: 0.78 }}>
          Driver onboarding is currently handled by the admin. If you want to apply, contact the admin to get added.
        </p>

        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <div className="card" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 900 }}>Requirements</div>
            <ul style={{ marginTop: 8, opacity: 0.85 }}>
              <li>Valid driver’s license</li>
              <li>Roadworthy vehicle</li>
              <li>Safe driving record</li>
            </ul>
          </div>

          <div className="card" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 900 }}>Next step</div>
            <div style={{ opacity: 0.85, marginTop: 8 }}>
              Ask admin to add you under <b>Admin → Add Driver (Manual)</b>.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}