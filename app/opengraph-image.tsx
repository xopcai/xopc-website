import { ImageResponse } from "next/og";

export const alt = "xopc — Keep what matters moving.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0b0d10",
          color: "#f7f8fa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 42, fontWeight: 700 }}>
          <div
            style={{
              width: 52,
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 15,
              background: "#2563eb",
              color: "white",
              fontSize: 30,
            }}
          >
            x
          </div>
          xopc
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 940 }}>
          <div style={{ fontSize: 72, lineHeight: 1.08, letterSpacing: "-3px", fontWeight: 700 }}>
            Keep what matters moving.
          </div>
          <div style={{ color: "#a7b0bf", fontSize: 28, lineHeight: 1.35 }}>
            A personal AI on your computer that remembers your goals and context—and picks up where you left off.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
