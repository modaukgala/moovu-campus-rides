"use client";

import Image from "next/image";
import Link from "next/link";

export default function AppHeader() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(12px)",
        background: "rgba(6, 20, 36, 0.55)", // blends into dark/blue hero
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="container"
        style={{
          paddingTop: 14,
          paddingBottom: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            textDecoration: "none",
          }}
        >
          {/* LOGO (no box, blends in) */}
          <div
            style={{
              width: 96,
              height: 56,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Image
              src="/Moovu-Logo-White.jpg"
              alt="MOOVU"
              width={180}
              height={100}
              priority
              style={{
                width: "auto",
                height: 52,
                objectFit: "contain",
                // soft glow so it pops without a box
                filter:
                  "drop-shadow(0 8px 22px rgba(0,0,0,0.55)) drop-shadow(0 0 18px rgba(227,28,61,0.25))",
              }}
            />
          </div>

          {/* Optional brand text (subtle, like moovurides style) */}
          <div>
            <div
              style={{
                fontWeight: 950,
                letterSpacing: 0.4,
                fontSize: 18,
                color: "rgba(255,255,255,0.92)",
                lineHeight: 1.1,
              }}
            >
              MOOVU CAMPUS RIDES
            </div>
            <div style={{ fontSize: 13, opacity: 0.75, color: "rgba(255,255,255,0.9)" }}>
              Safe • Fast • Trusted
            </div>
          </div>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Link className="btnSecondary" href="/request">
            Request Ride
          </Link>
        </nav>
      </div>
    </header>
  );
}