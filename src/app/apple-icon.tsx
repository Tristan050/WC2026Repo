import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#03080f",
          borderRadius: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(0,102,255,0.28)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -20,
            left: -20,
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(0,232,122,0.12)",
          }}
        />
        {/* "WC" logotype */}
        <span
          style={{
            fontFamily: "sans-serif",
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: -2,
            lineHeight: 1,
            color: "#ffffff",
            position: "relative",
          }}
        >
          <span style={{ color: "#3385ff" }}>W</span>C
        </span>
        {/* "2026" subtitle */}
        <span
          style={{
            fontFamily: "sans-serif",
            fontSize: 22,
            fontWeight: 700,
            color: "rgba(51,133,255,0.8)",
            letterSpacing: 4,
            position: "relative",
          }}
        >
          2026
        </span>
      </div>
    ),
    { ...size }
  );
}
