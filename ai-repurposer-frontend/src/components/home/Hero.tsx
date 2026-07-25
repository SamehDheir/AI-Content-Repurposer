"use client";
import { useState } from "react";
import { Splitter } from "./Splitter";
import { PasteField } from "./PasteField";
import { useScramble } from "@/src/hooks/useScramble";

/** A headline line that rises out of its own mask, like type dropping into a chase. */
function Line({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <span
        className="block"
        style={{ animation: `cr-rise 0.9s cubic-bezier(.16,.84,.28,1) ${delay}ms both` }}
      >
        {children}
      </span>
    </span>
  );
}

const FIGURES = [
  { n: "4", label: "finished formats" },
  { n: "2", label: "languages, natively" },
  { n: "1", label: "link to paste" },
];

export function Hero({ authed, onEnter }: { authed: boolean; onEnter: (url?: string) => void }) {
  const { frame } = useScramble("REEL → SHEET", { auto: true, speed: 34 });
  const [year] = useState(() => new Date().getFullYear());

  return (
    <section className="relative border-b border-rule pt-28 sm:pt-32" aria-labelledby="masthead">
      <div className="pointer-events-none absolute inset-0 gridlines opacity-40" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-340 grid-cols-1 gap-x-10 gap-y-14 px-5 pb-16 sm:px-8 lg:grid-cols-12 lg:pb-20">
        {/* ── Masthead copy ── */}
        <div className="lg:col-span-6 xl:col-span-6">
          <div
            className="mb-8 flex items-center gap-4"
            style={{ animation: "cr-rise 0.7s cubic-bezier(.16,.84,.28,1) 60ms both" }}
          >
            <span className="label bg-signal px-2 py-1.5 text-signal-ink">Issue 01</span>
            <span className="h-px flex-1 bg-rule" />
            <span className="label text-ink-3">{frame}</span>
          </div>

          <h1 id="masthead" className="display display-xl text-[clamp(2.9rem,7.6vw,5.6rem)]">
            <Line delay={120}>Cut one video</Line>
            <Line delay={220}>
              into <em className="italic text-signal">everything</em>
            </Line>
            <Line delay={320}>you publish.</Line>
          </h1>

          <p
            className="mt-8 max-w-xl text-[15px] leading-[1.75] text-ink-2 sm:text-base"
            style={{ animation: "cr-rise 0.8s cubic-bezier(.16,.84,.28,1) 460ms both" }}
          >
            Paste a YouTube link. We pull the transcript, lift the ideas, and hand back four
            finished pieces — a thread, a blog post, a Facebook post and a highlight reel — set in{" "}
            <span className="text-ink">Arabic or English</span>, ready to publish.
          </p>

          <div style={{ animation: "cr-rise 0.8s cubic-bezier(.16,.84,.28,1) 580ms both" }}>
            <PasteField authed={authed} onSubmit={onEnter} className="mt-9" />
          </div>

          {/* Figures */}
          <dl className="mt-12 grid grid-cols-3 border-t border-rule">
            {FIGURES.map((f, i) => (
              <div
                key={f.label}
                className={`py-5 pr-4 ${i > 0 ? "border-l border-rule pl-5" : ""}`}
                style={{
                  animation: `cr-rise 0.7s cubic-bezier(.16,.84,.28,1) ${700 + i * 90}ms both`,
                }}
              >
                <dt className="display text-4xl text-ink sm:text-5xl">{f.n}</dt>
                <dd className="label mt-2 leading-[1.6] text-ink-3">{f.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── Fig. 1 ── */}
        <div className="lg:col-span-6 xl:col-span-6">
          <div
            className="border border-rule bg-surface/40 p-4 sm:p-6"
            style={{ animation: "cr-rise 1s cubic-bezier(.16,.84,.28,1) 320ms both" }}
          >
            <div className="mb-4 flex items-center justify-between border-b border-rule pb-3">
              <span className="label text-ink-3">Fig. 1 — the split</span>
              <span className="label text-ink-3">{year}</span>
            </div>
            <Splitter />
          </div>
        </div>
      </div>
    </section>
  );
}
