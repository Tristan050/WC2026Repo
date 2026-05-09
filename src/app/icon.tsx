import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#03080f",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1.5px solid rgba(0,102,255,0.6)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Blue glow top-right */}
        <div
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "rgba(0,102,255,0.35)",
          }}
        />
        {/* "WC" logotype */}
        <span
          style={{
            fontFamily: "sans-serif",
            fontSize: 13,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.5px",
            lineHeight: 1,
            position: "relative",
          }}
        >
          <span style={{ color: "#3385ff" }}>W</span>C
        </span>
      </div>
    ),
    { ...size }
  );
}
