import Link from "next/link";

export default function StatusIndexPage() {
  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <h1>Ride Status</h1>
      <p>Please use the link provided after requesting a ride.</p>

      <Link href="/" className="btnSecondary" style={{ marginTop: 12 }}>
        Go Home
      </Link>
    </main>
  );
}
