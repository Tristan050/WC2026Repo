import "./globals.css";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://worldcupclutch.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "WorldCupClutch - World Cup 2026 Predictions & Live Match Pulse",
  description: "Live World Cup 2026 match center with prediction windows, bracket tracking, streaks and social share cards.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "WorldCupClutch",
    description: "Predict match moments. Track the bracket. Climb global ranks.",
    url: siteUrl,
    siteName: "WorldCupClutch",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "WorldCupClutch",
    description: "Predict match moments. Track the bracket. Climb global ranks."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
