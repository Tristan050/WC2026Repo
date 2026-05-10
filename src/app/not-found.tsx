import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | WorldCupClutch",
  description: "This page doesn't exist — head back to pick your World Cup 2026 winners.",
};

export default function NotFound() {
  return (
    <div className="nf-wrapper">
      <div className="nf-card">
        <div className="nf-ball" aria-hidden="true">⚽</div>
        <h1 className="nf-code">404</h1>
        <h2 className="nf-title">This page went offside</h2>
        <p className="nf-desc">
          The page you&apos;re looking for doesn&apos;t exist — maybe the match was postponed.
          Head back and pick your World Cup 2026 winners.
        </p>
        <div className="nf-actions">
          <Link href="/" className="nf-btn-primary">← Back to matches</Link>
          <Link href="/match/mexico-vs-south-africa" className="nf-btn-secondary">Opening match →</Link>
        </div>
        <p className="nf-hint">
          Looking for a specific match? Try{" "}
          <Link href="/" className="nf-link">worldcupclutch.com</Link>
        </p>
      </div>
    </div>
  );
}
