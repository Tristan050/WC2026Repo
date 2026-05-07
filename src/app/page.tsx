"use client";

import { useEffect, useMemo, useState } from "react";

type LiveMatch = {
  id: string;
  matchNumber: number;
  stage: string;
  status: string;
  kickoffUtc: string;
  homeScore: number;
  awayScore: number;
  homeSlot: { label: string };
  awaySlot: { label: string };
  stadium: { city: string; name: string };
  windows?: { id: string; status: string; kind: string }[];
};

type BracketStage = { stage: string; matches: { id: string; homeSlot: { label: string }; awaySlot: { label: string } }[] };

export default function HomePage() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [bracket, setBracket] = useState<BracketStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string>("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const run = async () => {
      try {
        await fetch("/api/session", { cache: "no-store" });
        const [mRes, bRes] = await Promise.all([
          fetch("/api/matches/live", { cache: "no-store" }),
          fetch("/api/matches/bracket", { cache: "no-store" })
        ]);
        const mData = await mRes.json();
        const bData = await bRes.json();
        setMatches(mData);
        setBracket(bData);
      } catch {
        setToast("Could not load live data. Check API/DB connection.");
      } finally {
        setLoading(false);
      }
    };
    run();

    const timer = setInterval(run, 30000);
    return () => clearInterval(timer);
  }, []);

  const activeMatch = matches[activeIndex] ?? null;

  const predictionWindow = useMemo(() => {
    const windows = activeMatch?.windows ?? [];
    return windows.find((w) => w.status === "OPEN") ?? null;
  }, [activeMatch]);

  const submitPick = async (choice: string) => {
    if (!activeMatch || !predictionWindow) {
      setToast("No open prediction window for this match yet.");
      return;
    }

    try {
      const res = await fetch("/api/predictions/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          windowId: predictionWindow.id,
          choice,
          confidence: 3
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setToast(data?.error ?? "Prediction failed.");
        return;
      }

      setToast("Pick submitted. Share your streak after results lock in.");
    } catch {
      setToast("Submit failed. Try again.");
    }
  };

  const nextKickoff = matches
    .map((m) => new Date(m.kickoffUtc).getTime())
    .filter((t) => t > Date.now())
    .sort((a, b) => a - b)[0];

  const countdown = nextKickoff
    ? `${Math.max(0, Math.floor((nextKickoff - Date.now()) / 3600000))}h`
    : "Live now";

  const formatKickoff = (kickoffUtc: string) =>
    new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date(kickoffUtc));

  const statusLabel = (status: string) => {
    if (["LIVE", "HALFTIME", "EXTRA_TIME", "PENALTIES"].includes(status)) return "LIVE";
    if (status === "FINISHED") return "FT";
    return "UPCOMING";
  };

  return (
    <main className="page">
      <div className="topbar">
        <div className="logo">PredictBattle WC26</div>
        <div className="badge">May 6, 2026 Build</div>
      </div>

      <section className="hero">
        <h1>Swipe predictions. Climb global ranks.</h1>
        <p>Live World Cup infrastructure is active: 104 matches preloaded, windows automated, bracket placeholders ready.</p>
      </section>

      <section className="grid">
        <div className="card">
          <div className="row">
            <strong>Live & Upcoming</strong>
            <span className="muted">Auto refresh 30s</span>
          </div>

          {loading ? (
            <p className="muted">Loading matches...</p>
          ) : (
            <div className="match-list">
              {matches.slice(0, 7).map((m, idx) => (
                <button key={m.id} className={`match ${activeIndex === idx ? "match-active" : ""}`} onClick={() => setActiveIndex(idx)}>
                  <div className="teamline">
                    <span>{m.homeSlot?.label ?? "Home"}</span>
                    <span>{m.homeScore} - {m.awayScore}</span>
                    <span>{m.awaySlot?.label ?? "Away"}</span>
                  </div>
                  <div className="row">
                    <span className="kick">{m.stage.replaceAll("_", " ")} - Match {m.matchNumber}</span>
                    <span className="kick">{formatKickoff(m.kickoffUtc)}</span>
                  </div>
                  <div className="row" style={{ marginTop: 6 }}>
                    <span className={`status-pill status-${statusLabel(m.status).toLowerCase()}`}>{statusLabel(m.status)}</span>
                    <span className="kick">{m.stadium?.city}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="kpis">
            <div className="kpi"><div className="v">104</div><div className="l">Total Matches</div></div>
            <div className="kpi"><div className="v">312</div><div className="l">Prediction Windows</div></div>
            <div className="kpi"><div className="v">{countdown}</div><div className="l">Next Kickoff</div></div>
          </div>
        </div>

        <div className="card">
          <div className="row" style={{ marginBottom: 8 }}>
            <strong>Swipe Prediction Card</strong>
            <div className="row"><span className="pulse" /><span className="muted">Live</span></div>
          </div>

          <div className="swiper">
            <p className="swipe-title">
              {activeMatch
                ? `${activeMatch.homeSlot?.label} vs ${activeMatch.awaySlot?.label}`
                : "Pick a match to start"}
            </p>
            <p className="muted" style={{ marginTop: 0 }}>
              {predictionWindow ? `Window open: ${predictionWindow.kind}` : "Prediction window currently locked/coming soon."}
            </p>

            <div className="choices">
              <button className="btn" onClick={() => submitPick("HOME")}>Home Wins</button>
              <button className="btn" onClick={() => submitPick("AWAY")}>Away Wins</button>
              <button className="btn" onClick={() => submitPick("DRAW")}>Draw</button>
              <button className="btn primary" onClick={() => setToast("Challenge link copied (stub).")}>Share Challenge</button>
            </div>
          </div>

          <div style={{ marginTop: 10 }} className="stage-grid">
            {bracket.map((s) => (
              <div key={s.stage} className="stage">
                <h4>{s.stage.replaceAll("_", " ")}</h4>
                <div>{s.matches.length} fixtures</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {toast ? <div className="toast" onClick={() => setToast("")}>{toast}</div> : null}
    </main>
  );
}
