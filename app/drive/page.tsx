import Link from "next/link";

export default function DrivePage() {
  return (
    <main className="container" style={{ paddingTop: 26, paddingBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Drive with Campus Rides</h1>
        <Link href="/" className="btnSecondary">
          Home
        </Link>
      </div>

      <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
        <div className="card" style={{ boxShadow: "none" }}>
          <div style={{ fontWeight: 900 }}>Requirements</div>
          <ul style={{ marginTop: 8, opacity: 0.85 }}>
            <li>Latest Proof Of Registration</li>
            <li>Valid driver’s license</li>
            <li>Roadworthy vehicle</li>
            <li>A Smartphone With Stable Internet Connection</li>
            <li>Waze/Google Maps</li>
            <li>WhatsApp number (for contact)</li>
            <li>Safe driving record</li>
          </ul>
        </div>

        {/* REPLACED: Next step box -> Button to application form */}
        <div className="card" style={{ boxShadow: "none", display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 900 }}>Next step</div>
          <div style={{ opacity: 0.8, lineHeight: 1.5 }}>
            Fill in the application form. Your details will be reviewed by the admin before activation.
          </div>

          <Link href="/drive/apply" className="btnPrimary" style={{ width: "fit-content" }}>
            Fill In Application Form
          </Link>
        </div>
      </div>
    </main>
  );
}