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
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          border: "1.5px solid #1a4aaa",
        }}
      >
        {/* Glow accent */}
        <div
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "rgba(0,102,255,0.45)",
            filter: "blur(6px)",
          }}
        />
        {/* Football emoji as icon */}
        <span
          style={{
            fontSize: 18,
            lineHeight: 1,
            position: "relative",
          }}
        >
          ⚽
        </span>
      </div>
    ),
    { ...size }
  );
}
