"use client";
import { useMotionGate } from "@/lib/hooks/useMotionGate";

/**
 * The hero machine. One source on the left, the splitter node in the middle,
 * the four artefacts it produces on the right — the product's whole flow drawn
 * as a shop diagram. Everything is one SVG so it stays crisp at any size and
 * the wires and cards can share a coordinate space.
 */

const MONO = "var(--font-geist-mono), ui-monospace, monospace";

const OUTPUTS = [
  { y: 24, name: "T H R E A D", meta: "9 posts", ink: "var(--fmt-thread)", widths: [214, 186, 138] },
  { y: 126, name: "B L O G   P O S T", meta: "1,240 words", ink: "var(--fmt-blog)", widths: [222, 208, 164] },
  { y: 228, name: "F A C E B O O K", meta: "1 post", ink: "var(--fmt-social)", widths: [196, 172, 120] },
  { y: 330, name: "H I G H L I G H T S", meta: "5 marks", ink: "var(--fmt-marks)", widths: [180, 214, 148] },
];

// Node → each card's left edge. Reused for the hairline and for the pulse that
// runs along it.
const WIRES = [
  "M300 180 C 332 180 330 68 356 68",
  "M300 180 C 332 180 330 170 356 170",
  "M300 180 C 332 180 330 272 356 272",
  "M300 180 C 332 180 330 374 356 374",
];

const PLATE_WIRE = "M300 180 C 300 300 220 300 152 348";

// Deterministic waveform — a random one would differ between server and client.
function amp(i: number) {
  const a = Math.sin(i * 0.68) * 0.5 + Math.sin(i * 0.21 + 1.1) * 0.3 + Math.sin(i * 1.7) * 0.2;
  return Math.max(0.1, Math.min(1, Math.abs(a) + 0.12));
}

function RegMark({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="var(--rule-strong)" strokeWidth="1">
      <line x1={x - 7} y1={y} x2={x + 7} y2={y} />
      <line x1={x} y1={y - 7} x2={x} y2={y + 7} />
    </g>
  );
}

export function Splitter({ className = "" }: { className?: string }) {
  // 34 waveform bars, four wire pulses, the ring and the blade — the densest
  // piece of motion on the site, and the first thing you scroll away from.
  const gate = useMotionGate<SVGSVGElement>();

  return (
    <svg
      ref={gate}
      viewBox="0 0 640 460"
      className={`w-full h-auto ${className}`}
      role="img"
      aria-label="Diagram: one video source is split into a thread, a blog post, a Facebook post, a highlight list and an optional image plate."
    >
      <RegMark x={16} y={16} />
      <RegMark x={624} y={16} />
      <RegMark x={16} y={444} />
      <RegMark x={624} y={444} />

      {/* ── Source ─────────────────────────────────────────────── */}
      <rect x="10" y="118" width="240" height="124" fill="var(--surface)" stroke="var(--rule)" />
      <line x1="10" y1="142" x2="250" y2="142" stroke="var(--rule)" />
      <text x="22" y="135" fill="var(--ink-3)" fontFamily={MONO} fontSize="9" letterSpacing="1.6">
        SOURCE
      </text>
      <text x="120" y="135" fill="var(--ink-3)" fontFamily={MONO} fontSize="9" letterSpacing="0.5">
        youtube.com/watch
      </text>
      <circle cx="236" cy="131" r="3.5" fill="var(--signal)" className="anim-pulse" />

      {/* Waveform */}
      <g>
        {Array.from({ length: 34 }, (_, i) => {
          const h = amp(i) * 52;
          return (
            <rect
              key={i}
              x={22 + i * 6.6}
              y={188 - h / 2}
              width="3.6"
              height={h}
              fill="var(--ink-3)"
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
                animation: `cr-wave ${(1.2 + ((i * 5) % 8) * 0.15).toFixed(2)}s ease-in-out ${((i % 9) * 0.08).toFixed(2)}s infinite`,
              }}
            />
          );
        })}
      </g>

      {/* Ruler + timecode */}
      <g stroke="var(--rule)">
        {Array.from({ length: 18 }, (_, i) => (
          <line key={i} x1={22 + i * 13} y1="220" x2={22 + i * 13} y2={i % 4 === 0 ? 227 : 224} />
        ))}
      </g>
      <text x="22" y="238" fill="var(--ink-3)" fontFamily={MONO} fontSize="8">
        00:00:00:00
      </text>
      <text x="238" y="238" fill="var(--ink-3)" fontFamily={MONO} fontSize="8" textAnchor="end">
        00:12:41:07
      </text>

      {/* Language chips */}
      <g>
        <rect x="10" y="256" width="46" height="22" fill="none" stroke="var(--rule)" />
        <text x="33" y="271" fill="var(--ink-2)" fontFamily={MONO} fontSize="9" textAnchor="middle" letterSpacing="1">
          AR
        </text>
        <rect x="62" y="256" width="46" height="22" fill="none" stroke="var(--rule)" />
        <text x="85" y="271" fill="var(--ink-2)" fontFamily={MONO} fontSize="9" textAnchor="middle" letterSpacing="1">
          EN
        </text>
        <text x="120" y="271" fill="var(--ink-3)" fontFamily={MONO} fontSize="8.5">
          whisper → llama
        </text>
      </g>

      {/* ── Feed + splitter node ───────────────────────────────── */}
      <line x1="250" y1="180" x2="288" y2="180" stroke="var(--rule-strong)" />
      <circle
        cx="300"
        cy="180"
        r="14"
        fill="none"
        stroke="var(--signal)"
        strokeWidth="1"
        strokeDasharray="3 4"
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          animation: "cr-spin 9s linear infinite",
        }}
      />
      <rect
        x="294"
        y="174"
        width="12"
        height="12"
        fill="var(--signal)"
        style={{ transformBox: "fill-box", transformOrigin: "center", transform: "rotate(45deg)" }}
      />

      {/* ── Wires ──────────────────────────────────────────────── */}
      {WIRES.map((d, i) => (
        <g key={d}>
          <path d={d} fill="none" stroke="var(--rule-strong)" strokeWidth="1" />
          <path
            d={d}
            fill="none"
            stroke={OUTPUTS[i].ink}
            strokeWidth="1.75"
            strokeDasharray="14 400"
            style={{ animation: `cr-wire 2.6s linear ${i * 0.45}s infinite` }}
          />
        </g>
      ))}
      <path d={PLATE_WIRE} fill="none" stroke="var(--rule)" strokeWidth="1" strokeDasharray="3 5" />

      {/* Trim line the sheets are cut against */}
      <line x1="348" y1="18" x2="348" y2="440" stroke="var(--rule)" strokeDasharray="2 6" />
      <g style={{ animation: "cr-blade 9s ease-in-out infinite" }}>
        <path d="M348 24 l-6 -7 h12 z" fill="var(--signal)" />
      </g>

      {/* ── Outputs ────────────────────────────────────────────── */}
      {OUTPUTS.map((o, i) => (
        <g key={o.name}>
          <rect x="356" y={o.y} width="274" height="88" fill="var(--surface)" stroke="var(--rule)" />
          <rect x="356" y={o.y} width="274" height="3" fill={o.ink} />
          <text x="370" y={o.y + 26} fill={o.ink} fontFamily={MONO} fontSize="9" letterSpacing="0.5">
            {o.name}
          </text>
          <text
            x="616"
            y={o.y + 26}
            fill="var(--ink-3)"
            fontFamily={MONO}
            fontSize="8.5"
            textAnchor="end"
          >
            {o.meta}
          </text>
          {o.widths.map((w, j) => (
            <rect
              key={j}
              x="370"
              y={o.y + 42 + j * 13}
              width={w}
              height="4"
              fill="var(--rule-strong)"
              style={{
                transformBox: "fill-box",
                transformOrigin: "left center",
                animation: `cr-typeline 0.5s cubic-bezier(.3,.8,.3,1) ${(0.7 + i * 0.22 + j * 0.12).toFixed(2)}s both`,
              }}
            />
          ))}
        </g>
      ))}

      {/* ── Optional image plate ───────────────────────────────── */}
      <g>
        <defs>
          <clipPath id="plateClip">
            <rect x="26" y="304" width="126" height="108" />
          </clipPath>
        </defs>
        <rect x="26" y="304" width="126" height="108" fill="var(--surface)" stroke="var(--rule)" />
        <g clipPath="url(#plateClip)">
          {Array.from({ length: 14 }, (_, i) => (
            <line
              key={i}
              x1={26 + i * 14 - 40}
              y1="412"
              x2={26 + i * 14 + 68}
              y2="304"
              stroke="var(--rule)"
            />
          ))}
        </g>
        <text x="36" y="325" fill="var(--ink-3)" fontFamily={MONO} fontSize="8.5" letterSpacing="1.4">
          PLATE
        </text>
        <text x="36" y="404" fill="var(--ink-3)" fontFamily={MONO} fontSize="8" letterSpacing="0.6">
          on request
        </text>
      </g>
    </svg>
  );
}
