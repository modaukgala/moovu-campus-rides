import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MOOVU Campus Rides",
  description: "Safe • Fast • Trusted Campus Rides",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}