import { ImageResponse } from "next/og";

export const alt = "AI Repurposer — one video, cut into everything you publish";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Tokens are inlined: ImageResponse renders in isolation with no stylesheet, so
// it cannot read the CSS variables the rest of the site is built on.
const PAPER = "#0b0b0a";
const SURFACE = "#121211";
const INK = "#f0ede6";
const INK_3 = "#867f72";
const RULE = "rgba(240,237,230,0.16)";
const SIGNAL = "#ff4d26";

const FORMATS: [string, string][] = [
  ["Thread", "#4b86f0"],
  ["Blog post", "#d29a37"],
  ["Facebook post", "#4a9d7c"],
  ["Highlight reel", "#c25d75"],
];

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: PAPER,
          color: INK,
          fontFamily: "Georgia, 'Times New Roman', serif",
          padding: 64,
          position: "relative",
        }}
      >
        {/* Masthead rule */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            borderBottom: `1px solid ${RULE}`,
            paddingBottom: 22,
          }}
        >
          {/* The mark: a source block and the four pieces it is cut into. */}
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ width: 16, height: 44, background: SIGNAL }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", gap: 4 }}>
                <div style={{ width: 13, height: 20, background: FORMATS[0][1] }} />
                <div style={{ width: 13, height: 20, background: FORMATS[1][1] }} />
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <div style={{ width: 13, height: 20, background: FORMATS[2][1] }} />
                <div style={{ width: 13, height: 20, background: FORMATS[3][1] }} />
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: 26,
              letterSpacing: "-0.01em",
            }}
          >
            AI Repurposer
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: 15,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: INK_3,
              fontFamily: "monospace",
            }}
          >
            Issue 01
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 54,
            fontSize: 82,
            lineHeight: 1.04,
            letterSpacing: "-0.022em",
          }}
        >
          <div style={{ display: "flex" }}>Cut one video</div>
          <div style={{ display: "flex", gap: 18 }}>
            <span>into</span>
            <span style={{ color: SIGNAL, fontStyle: "italic" }}>everything</span>
          </div>
          <div style={{ display: "flex" }}>you publish.</div>
        </div>

        {/* The four artefacts */}
        <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
          {FORMATS.map(([label, ink]) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                background: SURFACE,
                border: `1px solid ${RULE}`,
                borderTop: `3px solid ${ink}`,
                padding: "18px 20px",
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  letterSpacing: "0.13em",
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                  color: ink,
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontSize: 17,
            letterSpacing: "0.13em",
            textTransform: "uppercase",
            fontFamily: "monospace",
            color: INK_3,
          }}
        >
          Paste a YouTube link · Arabic or English
        </div>
      </div>
    ),
    size,
  );
}
