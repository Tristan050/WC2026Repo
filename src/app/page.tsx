"use client";

import { useEffect, useMemo, useState } from "react";

/* ─── Types ─── */
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
  oddsHomeWin?: number | null;
  oddsDraw?: number | null;
  oddsAwayWin?: number | null;
};

type BracketStage = {
  stage: string;
  matches: { id: string; homeSlot: { label: string }; awaySlot: { label: string }; status?: string }[];
};

type NavTab = "matches" | "predict" | "leaderboard" | "profile";

/* ─── Flag map ─── */
const NAME_TO_FLAG: Record<string, string> = {
  mexico:"🇲🇽", canada:"🇨🇦", usa:"🇺🇸", "united states":"🇺🇸", brazil:"🇧🇷", argentina:"🇦🇷",
  france:"🇫🇷", germany:"🇩🇪", spain:"🇪🇸", england:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", portugal:"🇵🇹", netherlands:"🇳🇱",
  belgium:"🇧🇪", japan:"🇯🇵", australia:"🇦🇺", morocco:"🇲🇦", senegal:"🇸🇳", ecuador:"🇪🇨",
  uruguay:"🇺🇾", colombia:"🇨🇴", norway:"🇳🇴", sweden:"🇸🇪", croatia:"🇭🇷", ghana:"🇬🇭",
  switzerland:"🇨🇭", scotland:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", turkey:"🇹🇷", turkiye:"🇹🇷", qatar:"🇶🇦",
  "south africa":"🇿🇦", "korea republic":"🇰🇷", "ir iran":"🇮🇷", "cote d'ivoire":"🇨🇮",
  "cabo verde":"🇨🇻", "saudi arabia":"🇸🇦", "new zealand":"🇳🇿", "bosnia and herzegovina":"🇧🇦",
  "congo dr":"🇨🇩", panama:"🇵🇦", algeria:"🇩🇿", austria:"🇦🇹", jordan:"🇯🇴", iraq:"🇮🇶",
  uzbekistan:"🇺🇿", curacao:"🇨🇼", haiti:"🇭🇹", tunisia:"🇹🇳", egypt:"🇪🇬", iran:"🇮🇷",
  paraguay:"🇵🇾",
};

function flagFromLabel(label: string): string {
  if (!label) return "";
  const lower = label.toLowerCase();
  return NAME_TO_FLAG[lower] ?? Object.entries(NAME_TO_FLAG).find(([k]) => lower.includes(k))?.[1] ?? "";
}

/* ─── Helpers ─── */
function formatKickoff(kickoffUtc: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(kickoffUtc));
}

function getCountdown(kickoffUtc: string): string | null {
  const diff = new Date(kickoffUtc).getTime() - Date.now();
  if (diff <= 0) return null;
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  if (days > 0)  return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function statusLabel(s: string): "LIVE" | "FT" | "UPCOMING" {
  if (["LIVE","HALFTIME","EXTRA_TIME","PENALTIES"].includes(s)) return "LIVE";
  if (s === "FINISHED") return "FT";
  return "UPCOMING";
}

function stageLabel(s: string): string {
  return ({
    GROUP:"Group Stage", ROUND_OF_32:"Round of 32", ROUND_OF_16:"Round of 16",
    QUARTER_FINAL:"Quarter-Final", SEMI_FINAL:"Semi-Final",
    THIRD_PLACE:"Third Place", FINAL:"Final 🏆",
  }[s] ?? s.replaceAll("_"," "));
}

/* ─── Bracket meta (colors + schedule) ─── */
const STAGE_META: Record<string, {
  color: string; bg: string; border: string; icon: string; total: number;
  startDate?: string;
}> = {
  GROUP:         { color:"#7fa4c4", bg:"rgba(59,158,255,0.05)",  border:"rgba(59,158,255,0.18)",  icon:"⚽", total:72, startDate:"Jun 11" },
  ROUND_OF_32:   { color:"#a0c8e8", bg:"rgba(100,180,255,0.06)", border:"rgba(100,180,255,0.20)", icon:"32", total:16, startDate:"Jun 28" },
  ROUND_OF_16:   { color:"#c0d8f0", bg:"rgba(130,200,255,0.07)", border:"rgba(130,200,255,0.22)", icon:"16", total:8,  startDate:"Jul 4" },
  QUARTER_FINAL: { color:"#ffd060", bg:"rgba(255,200,60,0.07)",  border:"rgba(255,200,60,0.28)",  icon:"⚡", total:4,  startDate:"Jul 9" },
  SEMI_FINAL:    { color:"#ff9f40", bg:"rgba(255,150,50,0.08)",  border:"rgba(255,150,50,0.30)",  icon:"🔥", total:2,  startDate:"Jul 14" },
  THIRD_PLACE:   { color:"#b0c8e0", bg:"rgba(176,200,224,0.06)", border:"rgba(176,200,224,0.22)", icon:"🥉", total:1,  startDate:"Jul 18" },
  FINAL:         { color:"#f5c842", bg:"rgba(245,200,66,0.08)",  border:"rgba(245,200,66,0.38)",  icon:"🏆", total:1,  startDate:"Jul 19" },
};

/* ─── Odds probability ─── */
function pseudoProbs(homeLabel: string, awayLabel: string) {
  const hash = (s: string) => s.split("").reduce((a, c) => a + c.charCodeAt(0), 17);
  const h = ((hash(homeLabel) % 35) + 28);
  const a = ((hash(awayLabel) % 30) + 20);
  const d = Math.max(8, 100 - h - a);
  const t = h + a + d;
  return { home: Math.round(h/t*100), draw: Math.round(d/t*100), away: Math.round(a/t*100) };
}

/* ═══════ SUB-COMPONENTS ═══════ */

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-team-row">
        <div className="skeleton skeleton-line" style={{ width:"55%", height:13 }} />
        <div className="skeleton skeleton-score" />
        <div className="skeleton skeleton-line" style={{ width:"55%", height:13, marginLeft:"auto" }} />
      </div>
      <div className="skeleton skeleton-line" style={{ width:"100%", height:6, borderRadius:3, margin:"8px 0 6px" }} />
      <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
        <div className="skeleton skeleton-line" style={{ width:"35%", height:10 }} />
        <div className="skeleton skeleton-line" style={{ width:"22%", height:10 }} />
      </div>
    </div>
  );
}

function OddsBar({ homeLabel, awayLabel, oddsHome, oddsDraw, oddsAway }: {
  homeLabel: string; awayLabel: string;
  oddsHome?: number | null; oddsDraw?: number | null; oddsAway?: number | null;
}) {
  const p = (oddsHome && oddsDraw && oddsAway)
    ? (() => {
        const h = 1/oddsHome, d = 1/oddsDraw, a = 1/oddsAway, t = h+d+a;
        return { home:Math.round(h/t*100), draw:Math.round(d/t*100), away:Math.round(a/t*100) };
      })()
    : pseudoProbs(homeLabel, awayLabel);

  return (
    <div className="odds-bar-wrap">
      <div className="odds-bar">
        <div className="odds-seg odds-home" style={{ width:`${p.home}%` }} />
        <div className="odds-seg odds-draw" style={{ width:`${p.draw}%` }} />
        <div className="odds-seg odds-away" style={{ width:`${p.away}%` }} />
      </div>
      <div className="odds-labels">
        <span className="odds-h">{p.home}%</span>
        <span className="odds-d">{p.draw}%</span>
        <span className="odds-a">{p.away}%</span>
      </div>
    </div>
  );
}

/* #11 — bracket card with coming-soon support */
function BracketCard({ stage, matches, onClick }: {
  stage: string;
  matches: BracketStage["matches"];
  onClick: () => void;
}) {
  const meta = STAGE_META[stage] ?? STAGE_META.GROUP;
  const finished  = matches.filter(m => m.status === "FINISHED").length;
  const filledPct = Math.min(100, (matches.length / meta.total) * 100);
  const donePct   = Math.min(100, (finished / meta.total) * 100);
  const isComingSoon = matches.length === 0;

  return (
    <button
      className={`bracket-card${isComingSoon ? " coming-soon" : ""}`}
      onClick={isComingSoon ? undefined : onClick}
      style={{ "--bc":meta.color, "--bc-bg":meta.bg, "--bc-border":meta.border } as React.CSSProperties}
    >
      <div className="bracket-card-header">
        <span className="bracket-icon">{meta.icon}</span>
        <span className="bracket-stage-name">{stageLabel(stage)}</span>
      </div>

      {isComingSoon ? (
        <>
          <div className="bracket-coming-label">⏳ Coming soon</div>
          {meta.startDate && <div className="bracket-coming-date">From {meta.startDate}</div>}
        </>
      ) : (
        <>
          <div className="bracket-fixture-count">
            <span className="bracket-filled">{matches.length}</span>
            <span className="bracket-of">/{meta.total}</span>
          </div>
          <div className="bracket-track">
            <div className="bracket-fill" style={{ width:`${filledPct}%` }} />
            <div className="bracket-done" style={{ width:`${donePct}%` }} />
          </div>
        </>
      )}
    </button>
  );
}

/* ─── Stub screens for nav tabs ─── */
function LeaderboardScreen() {
  return (
    <div className="card" style={{ marginTop: 12, textAlign: "center", padding: 32 }}>
      <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>🏅</div>
      <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: "1.05rem" }}>Global Leaderboard</p>
      <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>
        Rankings go live when the first prediction windows score.<br />
        Be early — climb fast.
      </p>
    </div>
  );
}

function ProfileScreen() {
  return (
    <div className="card" style={{ marginTop: 12, textAlign: "center", padding: 32 }}>
      <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>👤</div>
      <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: "1.05rem" }}>Your Profile</p>
      <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>
        Streak tracking, badges and history coming soon.<br />
        Start predicting to build your record.
      </p>
    </div>
  );
}

/* ═══════ MAIN PAGE ═══════ */
export default function HomePage() {
  const [matches, setMatches]     = useState<LiveMatch[]>([]);
  const [bracket, setBracket]     = useState<BracketStage[]>([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState<string | null>(null);
  const [totalPicks, setTotalPicks]   = useState(312);
  const [activeTab, setActiveTab]     = useState<NavTab>("matches");

  /* ─── Data fetch ─── */
  useEffect(() => {
    const run = async () => {
      try {
        await fetch("/api/session", { cache: "no-store" });
        const [mRes, bRes] = await Promise.all([
          fetch("/api/matches/live",    { cache: "no-store" }),
          fetch("/api/matches/bracket", { cache: "no-store" }),
        ]);
        const mData = await mRes.json();
        const bData = await bRes.json();
        setMatches(Array.isArray(mData) ? mData : []);
        setBracket(Array.isArray(bData) ? bData : []);
      } catch {
        setToast("Could not load live data. Check your connection.");
      } finally {
        setLoading(false);
      }
    };
    run();
    const t = setInterval(run, 30000);
    return () => clearInterval(t);
  }, []);

  const activeMatch      = matches[activeIndex] ?? null;
  const predictionWindow = useMemo(
    () => activeMatch?.windows?.find(w => w.status === "OPEN") ?? null,
    [activeMatch]
  );
  useEffect(() => { setSubmitted(null); }, [activeIndex]);

  /* ─── Submit pick ─── */
  const submitPick = async (choice: string) => {
    if (!activeMatch || !predictionWindow) {
      setToast("No open prediction window for this match yet.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/predictions/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ windowId: predictionWindow.id, choice, confidence: 3 }),
      });
      const data = await res.json();
      if (!res.ok) { setToast(data?.error ?? "Prediction failed."); return; }
      setSubmitted(choice);
      setTotalPicks(p => p + 1);
      setToast("✓ Pick locked in. Share your streak after the final whistle!");
    } catch {
      setToast("Submit failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── KPI values ─── */
  const nextKickoffTs = matches
    .map(m => new Date(m.kickoffUtc).getTime())
    .filter(t => t > Date.now())
    .sort((a, b) => a - b)[0];
  const liveCount     = matches.filter(m => statusLabel(m.status) === "LIVE").length;
  const finishedCount = bracket.reduce((s, g) => s + g.matches.filter(m => m.status === "FINISHED").length, 0);
  const countdownDisplay = liveCount > 0
    ? "LIVE"
    : nextKickoffTs ? (getCountdown(new Date(nextKickoffTs).toISOString()) ?? "Soon") : "—";

  /* ─── Bracket — fill in all 7 stages so coming-soon shows ─── */
  const ALL_STAGES = ["GROUP","ROUND_OF_32","ROUND_OF_16","QUARTER_FINAL","SEMI_FINAL","THIRD_PLACE","FINAL"];
  const bracketMap = Object.fromEntries(bracket.map(b => [b.stage, b]));
  const fullBracket = ALL_STAGES.map(s => bracketMap[s] ?? { stage: s, matches: [] });

  /* ─── Nav items ─── */
  const NAV: { id: NavTab; icon: string; label: string }[] = [
    { id:"matches",     icon:"⚽", label:"Matches"  },
    { id:"predict",     icon:"🎯", label:"Predict"  },
    { id:"leaderboard", icon:"🏅", label:"Ranks"    },
    { id:"profile",     icon:"👤", label:"Profile"  },
  ];

  /* ─── Render ─── */
  return (
    <>
      <main className="page">
        {/* Topbar */}
        <div className="topbar">
          <div className="logo">World<span>Cup</span>Clutch</div>
          <div className="badge">WC2026 · Beta</div>
        </div>

        {/* Hero — always visible */}
        <section className="hero">
          <h1>Pick the winners.<br /><em>Beat your friends.</em></h1>
          <p>Predict every moment of World Cup 2026 — 104 matches, live windows, global leaderboard. Your streak starts now.</p>
        </section>

        {/* Tab: leaderboard */}
        {activeTab === "leaderboard" && <LeaderboardScreen />}

        {/* Tab: profile */}
        {activeTab === "profile" && <ProfileScreen />}

        {/* Tabs: matches + predict (main grid) */}
        {(activeTab === "matches" || activeTab === "predict") && (
          <section className="grid">

            {/* ── LEFT: match list (hidden on mobile predict tab) ── */}
            <div className="card" style={{ display: activeTab === "predict" ? undefined : undefined }}>
              <div className="row">
                <span className="section-title">Live &amp; Upcoming</span>
                <span className="muted" style={{ fontSize:"0.75rem" }}>↻ 30s</span>
              </div>

              <div className="match-list">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                  : matches.slice(0, 8).map((m, idx) => {
                      const sl = statusLabel(m.status);
                      const countdown = sl === "UPCOMING" ? getCountdown(m.kickoffUtc) : null;
                      return (
                        <button
                          key={m.id}
                          className={`match${activeIndex === idx ? " match-active" : ""}`}
                          onClick={() => { setActiveIndex(idx); setActiveTab("predict"); }}
                        >
                          <div className="teamline">
                            <span className="team-name">
                              <span className="flag">{flagFromLabel(m.homeSlot?.label ?? "")}</span>
                              {m.homeSlot?.label ?? "Home"}
                            </span>
                            <span className="score-block">
                              {sl === "UPCOMING"
                                ? <span className="score-vs">vs</span>
                                : <>{m.homeScore}–{m.awayScore}</>}
                            </span>
                            <span className="team-name away">
                              {m.awaySlot?.label ?? "Away"}
                              <span className="flag">{flagFromLabel(m.awaySlot?.label ?? "")}</span>
                            </span>
                          </div>
                          <OddsBar
                            homeLabel={m.homeSlot?.label ?? ""}
                            awayLabel={m.awaySlot?.label ?? ""}
                            oddsHome={m.oddsHomeWin}
                            oddsDraw={m.oddsDraw}
                            oddsAway={m.oddsAwayWin}
                          />
                          <div className="match-meta">
                            <span className={`status-pill status-${sl.toLowerCase()}`}>{sl}</span>
                            {countdown && <span className="countdown-pill">in {countdown}</span>}
                            <span className="kick">{m.stadium?.city}</span>
                            <span className="kick kick-right">{formatKickoff(m.kickoffUtc)}</span>
                          </div>
                        </button>
                      );
                    })}
              </div>

              {/* 4-col KPIs */}
              <div className="kpis">
                <div className="kpi">
                  <div className="v">104</div>
                  <div className="l">Matches</div>
                </div>
                <div className="kpi">
                  <div className="v">{totalPicks.toLocaleString()}</div>
                  <div className="l">Total Picks</div>
                </div>
                <div className="kpi">
                  <div className="v kpi-countdown">
                    {liveCount > 0 && <span className="kpi-pulse" />}
                    <span style={{ fontSize: countdownDisplay.length > 5 ? "1.1rem" : undefined }}>
                      {countdownDisplay}
                    </span>
                  </div>
                  <div className="l">{liveCount > 0 ? "Live Now" : "Next Kickoff"}</div>
                </div>
                <div className="kpi">
                  <div className="v">{finishedCount}<span className="kpi-sub">/104</span></div>
                  <div className="l">Played</div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: predict + bracket ── */}
            <div className="card">
              <div className="row" style={{ marginBottom:12 }}>
                <span className="section-title">Swipe &amp; Predict</span>
                <div className="row" style={{ gap:6 }}>
                  <span className="pulse" />
                  <span className="muted" style={{ fontSize:"0.75rem" }}>Live</span>
                </div>
              </div>

              <div className="swiper">
                {activeMatch ? (
                  <>
                    <p className="swipe-title">
                      {flagFromLabel(activeMatch.homeSlot?.label ?? "")} {activeMatch.homeSlot?.label}
                      <span style={{ color:"var(--muted)", margin:"0 8px", fontWeight:400 }}>vs</span>
                      {activeMatch.awaySlot?.label} {flagFromLabel(activeMatch.awaySlot?.label ?? "")}
                    </p>
                    <p className="muted" style={{ margin:"0 0 4px", fontSize:"0.78rem" }}>
                      {stageLabel(activeMatch.stage)} · Match {activeMatch.matchNumber} · {activeMatch.stadium?.city}
                    </p>
                    {predictionWindow
                      ? <p style={{ margin:0, fontSize:"0.78rem", color:"var(--ok)" }}>🟢 Window open — {predictionWindow.kind.replaceAll("_"," ")}</p>
                      : <p style={{ margin:0, fontSize:"0.78rem", color:"var(--muted)" }}>🔒 Window locked · opens 24h before kickoff</p>}
                  </>
                ) : (
                  <>
                    <p className="swipe-title" style={{ color:"var(--muted)" }}>Select a match →</p>
                    <p className="muted" style={{ margin:0, fontSize:"0.82rem" }}>Tap any match from the list to start predicting.</p>
                  </>
                )}

                <div className="choices">
                  {(["HOME","AWAY","DRAW"] as const).map(choice => (
                    <button
                      key={choice}
                      className={[
                        "btn pick-btn",
                        submitted === choice ? "pick-selected" : "",
                        (!predictionWindow || submitting) ? "disabled" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => submitPick(choice)}
                      disabled={!predictionWindow || submitting}
                    >
                      {choice === "HOME" && <>{flagFromLabel(activeMatch?.homeSlot?.label ?? "")} Home Wins</>}
                      {choice === "AWAY" && <>Away Wins {flagFromLabel(activeMatch?.awaySlot?.label ?? "")}</>}
                      {choice === "DRAW" && "Draw"}
                    </button>
                  ))}
                  <button
                    className={`btn${submitted ? " btn-share" : " disabled"}`}
                    onClick={() => setToast("🔗 Challenge link copied! (coming soon)")}
                    disabled={!submitted}
                  >
                    🔗 Share Pick
                  </button>
                </div>
              </div>

              {/* Bracket — all 7 stages, coming-soon for empty ones */}
              <div style={{ marginTop:16 }}>
                <span className="section-title" style={{ display:"block", marginBottom:10 }}>Tournament Bracket</span>
                {loading ? (
                  <div className="bracket-grid">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="skeleton" style={{ height:76, borderRadius:12 }} />
                    ))}
                  </div>
                ) : (
                  <div className="bracket-grid">
                    {fullBracket.map(s => (
                      <BracketCard
                        key={s.stage}
                        stage={s.stage}
                        matches={s.matches}
                        onClick={() => setToast(`${stageLabel(s.stage)}: ${s.matches.length} fixtures loaded`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Toast — sits above bottom nav */}
      {toast && <div className="toast" onClick={() => setToast("")}>{toast}</div>}

      {/* ── Bottom nav (#10) ── */}
      <nav className="bottom-nav">
        {NAV.map(item => (
          <button
            key={item.id}
            className={`nav-item${activeTab === item.id ? " nav-active" : ""}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
}