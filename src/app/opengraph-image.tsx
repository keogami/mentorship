import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "keogami's mentorship — 1:1 programming sessions"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          backgroundColor: "#0a0a0a",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "16px",
          }}
        >
          <span style={{ color: "#22c55e", fontSize: 64 }}>$</span>
          <span style={{ color: "#fafafa", fontSize: 64 }}>
            {"keogami's mentorship"}
          </span>
        </div>
        <div
          style={{
            color: "#a1a1aa",
            fontSize: 36,
            marginTop: "24px",
            paddingLeft: "80px",
          }}
        >
          1:1 programming sessions
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "64px",
            paddingLeft: "80px",
          }}
        >
          <span style={{ color: "#22c55e", fontSize: 28 }}>{">"}</span>
          <span style={{ color: "#71717a", fontSize: 28 }}>
            book daily sessions, get unstuck faster, build real projects
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
