import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const home    = searchParams.get("home")  ?? "Home";
  const away    = searchParams.get("away")  ?? "Away";
  const stage   = searchParams.get("stage") ?? "World Cup 2026";
  const hs      = searchParams.get("hs")    ?? "0";
  const as_     = searchParams.get("as")    ?? "0";
  const status  = searchParams.get("status") ?? "UPCOMING";
  const pick    = searchParams.get("pick");  // HOME | AWAY | DRAW

  const isLive  = ["LIVE","HALFTIME","EXTRA_TIME","PENALTIES"].includes(status);
  const isFt    = status === "FINISHED";

  const pickLabel: Record<string, string> = {
    HOME: `I picked ${home} to win`,
    AWAY: `I picked ${away} to win`,
    DRAW: "I picked a Draw",
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #060b12 0%, #0d1c30 50%, #060b12 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow blobs */}
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,158,255,0.18) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: -60,
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(47,217,160,0.10) 0%, transparent 70%)",
        }} />

        {/* Top bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "32px 52px 0",
        }}>
          <span style={{
            fontSize: 28, fontWeight: 900, letterSpacing: "0.05em",
            textTransform: "uppercase", color: "#fff",
          }}>
            World<span style={{ color: "#3b9eff" }}>Cup</span>Clutch
          </span>
          <span style={{
            fontSize: 18, color: "#8ab4d0",
            padding: "6px 18px",
            border: "1px solid rgba(59,158,255,0.3)",
            borderRadius: 999,
            background: "rgba(59,158,255,0.08)",
          }}>
            {stage}
          </span>
        </div>

        {/* Main matchup */}
        <div style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: "0 52px",
          gap: 0,
        }}>
          {/* Home team */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}>
            <span style={{ fontSize: 64 }}>🏟️</span>
            <span style={{
              fontSize: 36, fontWeight: 900, color: "#fff",
              textAlign: "center", letterSpacing: "-0.01em",
            }}>
              {home}
            </span>
          </div>

          {/* Score / vs */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            padding: "0 40px",
          }}>
            {isLive || isFt ? (
              <div style={{
                fontSize: 72, fontWeight: 900,
                color: "#fff", letterSpacing: "0.08em",
                background: "rgba(255,255,255,0.07)",
                border: "2px solid rgba(255,255,255,0.15)",
                borderRadius: 20,
                padding: "8px 32px",
              }}>
                {hs} – {as_}
              </div>
            ) : (
              <div style={{
                fontSize: 48, fontWeight: 700,
                color: "#3b9eff", letterSpacing: "0.12em",
              }}>
                VS
              </div>
            )}
            {isLive && (
              <span style={{
                fontSize: 18, fontWeight: 800, color: "#ff8090",
                background: "rgba(255,64,96,0.15)",
                border: "1px solid rgba(255,64,96,0.5)",
                borderRadius: 999, padding: "4px 16px",
                letterSpacing: "0.08em",
              }}>
                ● LIVE
              </span>
            )}
            {isFt && (
              <span style={{
                fontSize: 18, fontWeight: 800, color: "#60e8b0",
                background: "rgba(47,217,160,0.12)",
                border: "1px solid rgba(47,217,160,0.35)",
                borderRadius: 999, padding: "4px 16px",
                letterSpacing: "0.08em",
              }}>
                FULL TIME
              </span>
            )}
          </div>

          {/* Away team */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}>
            <span style={{ fontSize: 64 }}>✈️</span>
            <span style={{
              fontSize: 36, fontWeight: 900, color: "#fff",
              textAlign: "center", letterSpacing: "-0.01em",
            }}>
              {away}
            </span>
          </div>
        </div>

        {/* Pick banner */}
        {pick && pickLabel[pick] && (
          <div style={{
            margin: "0 52px 20px",
            padding: "14px 28px",
            background: "linear-gradient(135deg, rgba(59,158,255,0.15), rgba(59,158,255,0.08))",
            border: "1px solid rgba(59,158,255,0.4)",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <span style={{ fontSize: 28 }}>🎯</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#9fd4ff" }}>
              {pickLabel[pick]}
            </span>
            <span style={{ marginLeft: "auto", fontSize: 18, color: "#8ab4d0" }}>
              Can you beat me?
            </span>
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          padding: "12px 52px 32px",
          color: "#4a7090",
          fontSize: 17,
          letterSpacing: "0.04em",
        }}>
          worldcupclutch.com · Predict every moment of WC2026
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}