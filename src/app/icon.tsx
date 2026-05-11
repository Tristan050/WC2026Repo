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
          background: "linear-gradient(145deg, #0a1628 0%, #03080f 100%)",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1.5px solid #1a4aaa",
          overflow: "hidden",
        }}
      >
        {/* Blue glow */}
        <div
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "rgba(0,102,255,0.5)",
            filter: "blur(7px)",
          }}
        />
        {/* WCC monogram */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 900,
            color: "#4d94ff",
            letterSpacing: "-0.04em",
            fontFamily: "system-ui, -apple-system, sans-serif",
            position: "relative",
          }}
        >
          WCC
        </span>
      </div>
    ),
    { ...size }
  );
}
