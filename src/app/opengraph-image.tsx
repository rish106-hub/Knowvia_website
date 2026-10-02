import { ImageResponse } from "next/og";

export const alt = "Knowvia. Know your cover. Before you need it.";
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
          background: "#163F42",
          color: "#F3F7F6",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", gap: 18, fontSize: 30, color: "#B9CCC9" }}>
          <span>Known</span>
          <span>|</span>
          <span>Unknown</span>
          <span>|</span>
          <span style={{ color: "#E0A02B" }}>Next</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>
            Know your cover. Before you need it.
          </div>
          <div style={{ width: 120, height: 10, borderRadius: 5, background: "#E0A02B" }} />
        </div>
        <div style={{ fontSize: 40, fontWeight: 700 }}>Knowvia</div>
      </div>
    ),
    size,
  );
}
