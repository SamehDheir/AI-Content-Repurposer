interface Props {
  bars?: number;
  className?: string;
  /** Still bars read as "loaded but idle"; live bars are being transcribed. */
  live?: boolean;
  /** Sweeps a signal-coloured playhead across the form. */
  playhead?: boolean;
  color?: string;
  /** Override when the waveform sits on an inverted band. */
  playheadColor?: string;
}

// Deterministic so the server and the client draw the same waveform. A random
// shape would trip hydration.
function amplitude(i: number, total: number) {
  const a = Math.sin(i * 0.7) * 0.5 + Math.sin(i * 0.23 + 1.1) * 0.32 + Math.sin(i * 1.9) * 0.18;
  const envelope = 0.45 + 0.55 * Math.sin((i / total) * Math.PI);
  return Math.max(0.12, Math.min(1, Math.abs(a) * envelope + 0.14));
}

export function Waveform({
  bars = 56,
  className = "",
  live = false,
  playhead = false,
  color = "var(--ink-3)",
  playheadColor = "var(--signal)",
}: Props) {
  return (
    <div className={`relative flex items-center gap-[2px] ${className}`} aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => {
        const height = amplitude(i, bars);
        return (
          <span
            key={i}
            className="flex-1 origin-center rounded-[1px]"
            style={{
              background: color,
              // Rounded: an unbounded float serialises differently on the
              // server and the client, which React reports as a hydration
              // mismatch on the style attribute.
              height: `${(height * 100).toFixed(2)}%`,
              animation: live
                ? `cr-wave ${(1.1 + ((i * 7) % 9) * 0.12).toFixed(2)}s ease-in-out ${((i % 11) * 0.07).toFixed(2)}s infinite`
                : undefined,
            }}
          />
        );
      })}
      {playhead && (
        <span
          className="pointer-events-none absolute inset-y-[-15%] w-px"
          style={{ background: playheadColor, animation: "cr-playhead 4.5s linear infinite" }}
        />
      )}
    </div>
  );
}
