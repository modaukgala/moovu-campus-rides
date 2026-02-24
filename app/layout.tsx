import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Campus Ride",
    template: "%s • Campus Ride",
  },
  description: "Safe campus transport for students. Request rides, track drivers, and get notified instantly.",
  applicationName: "Campus Ride",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Campus Ride",
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: "#003a70",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#003a70" />

        {/* Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192.png" />

        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #001b33 0%, #000f1f 100%)",
          color: "#ffffff",
        }}
      >
        {children}
      </body>
    </html>
  );
}