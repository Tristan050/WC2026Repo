"use client";

import { useEffect, useState } from "react";

const FLAGS: Record<string, string> = {
  mexico:"🇲🇽", canada:"🇨🇦", usa:"🇺🇸", "united states":"🇺🇸", brazil:"🇧🇷",
  argentina:"🇦🇷", france:"🇫🇷", germany:"🇩🇪", spain:"🇪🇸", england:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  portugal:"🇵🇹", netherlands:"🇳🇱", belgium:"🇧🇪", japan:"🇯🇵", australia:"🇦🇺",
  morocco:"🇲🇦", senegal:"🇸🇳", ecuador:"🇪🇨", uruguay:"🇺🇾", colombia:"🇨🇴",
  croatia:"🇭🇷", ghana:"🇬🇭", switzerland:"🇨🇭", "south africa":"🇿🇦",
  "saudi arabia":"🇸🇦", "korea republic":"🇰🇷", "ir iran":"🇮🇷", panama:"🇵🇦",
  austria:"🇦🇹", turkey:"🇹🇷", turkiye:"🇹🇷", norway:"🇳🇴", sweden:"🇸🇪",
  scotland:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", qatar:"🇶🇦", "cote d'ivoire":"🇨🇮", "cabo verde":"🇨🇻",
  "new zealand":"🇳🇿", czechia:"🇨🇿", "congo dr":"🇨🇩", algeria:"🇩🇿",
  jordan:"🇯🇴", iraq:"🇮🇶", uzbekistan:"🇺🇿", curacao:"🇨🇼", haiti:"🇭🇹",
  tunisia:"🇹🇳", egypt:"🇪🇬", iran:"🇮🇷", paraguay:"🇵🇾", chile:"🇨🇱",
};
function flag(label: string): string {
  const l = label.toLowerCase();
  return FLAGS[l] ?? Object.entries(FLAGS).find(([k]) => l.includes(k))?.[1] ?? "⚽";
}

type Distribution = { home: number; draw: number; away: number; total: number };

export function MatchPickPanel({
  matchId,
  windowId,
  home,
  away,
}: {
  matchId: string;
  windowId: string;
  home: string;
  away: string;
}) {
  const [submitted, setSubmitted] = useState<"HOME" | "DRAW" | "AWAY" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [distribution, setDistribution] = useState<Distribution | null>(null);

  /* ── On mount: establish session + restore existing pick ── */
  useEffect(() => {
    fetch("/api/session").catch(() => {});

    fetch("/api/auth/session")
      .then(r => r.json())
      .then(d => {
        if (!d?.user?.id) return;
        fetch("/api/profile/me")
          .then(r => r.ok ? r.json() : null)
          .then(p => {
            if (!p?.picks) return;
            const existing = (p.picks as { choice: string; window: { match: { id: string } } }[])
              .find(pk => pk.window?.match?.id === matchId);
            if (existing) {
              setSubmitted(existing.choice as "HOME" | "DRAW" | "AWAY");
              // also load distribution for already-picked matches
              fetch(`/api/picks/distribution?windowId=${windowId}`)
                .then(r => r.ok ? r.json() : null)
                .then(d => { if (d) setDistribution(d); })
                .catch(() => {});
            }
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, [matchId, windowId]);

  const submit = async (choice: "HOME" | "DRAW" | "AWAY") => {
    if (submitting || submitted) return;
    setSubmitting(true);
    setError("");
    try {
      const doPost = () =>
        fetch("/api/predictions/submit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ windowId, choice, confidence: 3 }),
        });
      let res = await doPost();
      if (res.status === 401) { await fetch("/api/session"); res = await doPost(); }
      const data = await res.json();
      if (!res.ok) { setError(data?.error ?? "Pick failed — try again."); return; }
      setSubmitted(choice);
      fetch(`/api/picks/distribution?windowId=${windowId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setDistribution(d); })
        .catch(() => {});
    } catch {
      setError("Network error — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const pickLabel = submitted === "HOME" ? `${home} to win`
    : submitted === "AWAY" ? `${away} to win`
    : submitted === "DRAW" ? "Draw"
    : null;

  return (
    <div className="mp-pick-panel">
      <div className="mp-pick-header">
        <span className="mp-pick-dot" aria-hidden="true" />
        <h2 className="mp-pick-title">
          {submitted ? "✅ Pick locked in" : "🎯 Make your prediction"}
        </h2>
      </div>

      {!submitted ? (
        <div className="mp-pick-btns" role="group" aria-label="Prediction choices">
          {(["HOME", "DRAW", "AWAY"] as const).map(c => (
            <button
              key={c}
              className={`mp-pick-btn mp-pick-${c.toLowerCase()}`}
              onClick={() => submit(c)}
              disabled={submitting}
              aria-label={c === "HOME" ? `Pick ${home} to win` : c === "AWAY" ? `Pick ${away} to win` : "Pick a draw"}
            >
              {c !== "DRAW" && (
                <span className="mp-pick-btn-flag" aria-hidden="true">
                  {flag(c === "HOME" ? home : away)}
                </span>
              )}
              <span className="mp-pick-btn-label">
                {c === "HOME" ? `${home} wins` : c === "AWAY" ? `${away} wins` : "Draw"}
              </span>
              {c === "DRAW" && (
                <span className="mp-pick-btn-sub">90 min</span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="mp-pick-confirmed" role="status">
          <div className="mp-pick-confirmed-text">
            <span className="mp-pick-confirmed-check">✓</span>
            Your pick: <strong>{pickLabel}</strong>
            <span className="mp-pick-confirmed-pts">+3 pts if correct</span>
          </div>
        </div>
      )}

      {error && <p className="mp-pick-error" role="alert">{error}</p>}

      {/* Distribution — shown after pick */}
      {submitted && (
        <div className="mp-distribution" aria-label="Community pick distribution">
          <p className="mp-dist-label">
            {distribution && distribution.total > 0
              ? `${distribution.total.toLocaleString()} players predicted this match`
              : "Community picks"}
          </p>
          {(["HOME", "DRAW", "AWAY"] as const).map(c => {
            const count = distribution
              ? (c === "HOME" ? distribution.home : c === "DRAW" ? distribution.draw : distribution.away)
              : 0;
            const pct = distribution && distribution.total > 0
              ? Math.round(count / distribution.total * 100)
              : c === "HOME" ? 50 : c === "DRAW" ? 25 : 25;
            const label = c === "HOME" ? `${flag(home)} ${home}` : c === "AWAY" ? `${away} ${flag(away)}` : "Draw";
            return (
              <div key={c} className={`mp-dist-row${submitted === c ? " mp-dist-mine" : ""}`}>
                <span className="mp-dist-row-label">{label}</span>
                <div className="mp-dist-bar-wrap">
                  <div className="mp-dist-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="mp-dist-pct">{pct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
