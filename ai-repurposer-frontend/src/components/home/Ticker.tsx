"use client";
import { useMotionGate } from "@/lib/hooks/useMotionGate";

const PIECES = [
  "Twitter thread",
  "Blog post",
  "Facebook post",
  "Highlight reel",
  "Featured image",
];

const RUNNERS = [
  "MODERN STANDARD ARABIC",
  "ENGLISH",
  "WHISPER LARGE V3",
  "LLAMA 3.1",
  "YOUTUBE CAPTIONS",
  "YT-DLP FALLBACK",
];

/** Repeats inside each half. Two halves of one repeat left a visible gap at the
 *  loop point above ~1400px, because the keyframe travels exactly half the
 *  track: if half a track is narrower than the viewport, the tail shows. Three
 *  repeats puts a half at roughly 4000px, past any real display. */
const REPEATS = 3;

function Row({
  children,
  seconds,
  reverse = false,
  className = "",
}: {
  children: React.ReactNode;
  /** Seconds for ONE repeat; scaled by REPEATS so the speed stays put. */
  seconds: number;
  reverse?: boolean;
  className?: string;
}) {
  // A marquee is one transform, but it is a transform on a ~4000px-wide layer
  // that never stops. Off screen it is pure cost.
  const gate = useMotionGate<HTMLDivElement>();

  const half = Array.from({ length: REPEATS }, (_, i) => (
    <span key={i} className="flex shrink-0 items-center">
      {children}
    </span>
  ));

  return (
    <div ref={gate} className={`overflow-hidden ${className}`}>
      <div
        className="anim-marquee flex w-max items-center"
        style={{
          ["--marquee-duration" as string]: `${seconds * REPEATS}s`,
          animationDirection: reverse ? "reverse" : undefined,
        }}
      >
        {/* Two identical halves; the keyframe travels exactly one half. */}
        <span className="flex shrink-0 items-center">{half}</span>
        <span className="flex shrink-0 items-center">{half}</span>
      </div>
    </div>
  );
}

export function Ticker() {
  const headline = (
    <>
      {PIECES.map((p, i) => (
        <span key={`${p}-${i}`} className="flex shrink-0 items-center">
          <span className="display px-7 text-2xl sm:text-3xl">{p}</span>
          <span className="text-signal-on-ink">✳</span>
        </span>
      ))}
    </>
  );

  const runner = (
    <>
      {RUNNERS.map((r, i) => (
        <span key={`${r}-${i}`} className="flex shrink-0 items-center">
          <span className="label px-6 text-ink-3">{r}</span>
          <span className="h-1 w-1 bg-rule-strong" />
        </span>
      ))}
    </>
  );

  return (
    <section aria-hidden="true" className="border-b border-rule">
      <Row seconds={38} className="bg-ink py-3 text-paper">
        {headline}
      </Row>
      <Row seconds={55} reverse className="border-t border-rule py-2.5">
        {runner}
      </Row>
    </section>
  );
}
