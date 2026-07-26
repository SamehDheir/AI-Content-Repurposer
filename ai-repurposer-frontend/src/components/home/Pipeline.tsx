"use client";
import { useEffect, useRef } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { useMotionGate } from "@/lib/hooks/useMotionGate";
import { SectionHead } from "./SectionHead";

const MONO = "var(--font-geist-mono), ui-monospace, monospace";

const STAGES = [
  {
    n: "01",
    title: "Intake",
    time: "instant",
    body: "You paste a link. A slot is claimed against your month, the job is written down and queued, and you get a number back before the page has finished settling.",
  },
  {
    n: "02",
    title: "Transcript",
    time: "the slow part",
    body: "YouTube's own captions first, because they are exact and free. When a video has none, the audio is pulled down and put through Whisper large-v3. Three attempts before we admit defeat.",
  },
  {
    n: "03",
    title: "The cut",
    time: "all at once",
    body: "Four formats are written in parallel, not one after another, then committed in a single transaction — so a job is never left half-finished on your desk.",
  },
  {
    n: "04",
    title: "Delivery",
    time: "live",
    body: "The desk streams its own status. Nothing to refresh: the row turns over the moment the work lands, and the pieces are already sitting inside it.",
  },
];

/**
 * How far the reader has travelled through the rail, written as 0…1 into
 * `--rail-progress` on the rail container.
 *
 * As React state this re-rendered the entire section — four stages, four
 * figures and every animated rect inside them — on each frame of a scroll, all
 * to move one `scaleY`. Setting the variable through the ref keeps it out of
 * React entirely.
 */
function useRailProgress(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const mid = window.innerHeight * 0.62;
      const p = Math.max(0, Math.min(1, (mid - top) / height));
      el.style.setProperty("--rail-progress", p.toFixed(4));
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);
}

function Figure({ stage }: { stage: number }) {
  // Each figure is a dozen-odd infinite animations and only one or two of the
  // four stages are ever on screen, so each gates its own.
  const gate = useMotionGate<SVGSVGElement>();

  if (stage === 0)
    return (
      <svg ref={gate} viewBox="0 0 160 64" className="w-full">
        <rect x="1" y="16" width="158" height="32" fill="none" stroke="var(--rule)" />
        <text x="10" y="36" fill="var(--ink-3)" fontFamily={MONO} fontSize="9">
          youtube.com/watch?v=
        </text>
        <rect x="116" y="26" width="1.5" height="13" fill="var(--signal)" className="anim-blink" />
        <text x="130" y="36" fill="var(--signal)" fontFamily={MONO} fontSize="9">
          #1
        </text>
      </svg>
    );

  if (stage === 1)
    return (
      <svg ref={gate} viewBox="0 0 160 64" className="w-full">
        {Array.from({ length: 16 }, (_, i) => {
          const h = 6 + (Math.abs(Math.sin(i * 0.9)) * 34);
          return (
            <rect
              key={i}
              x={2 + i * 4.4}
              y={32 - h / 2}
              width="2.4"
              height={h}
              fill="var(--ink-3)"
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
                animation: `cr-wave ${(1 + (i % 5) * 0.2).toFixed(2)}s ease-in-out ${(i * 0.06).toFixed(2)}s infinite`,
              }}
            />
          );
        })}
        <path d="M78 32 h10 m-4 -4 l4 4 l-4 4" fill="none" stroke="var(--signal)" strokeWidth="1.2" />
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x="96"
            y={18 + i * 9}
            width={i === 3 ? 34 : 62}
            height="3"
            fill="var(--rule-strong)"
            style={{
              transformBox: "fill-box",
              transformOrigin: "left center",
              animation: `cr-typeline 0.6s ease-out ${(i * 0.25).toFixed(2)}s infinite alternate`,
            }}
          />
        ))}
      </svg>
    );

  if (stage === 2)
    return (
      <svg ref={gate} viewBox="0 0 160 64" className="w-full">
        {["--fmt-thread", "--fmt-blog", "--fmt-social", "--fmt-marks"].map((c, i) => (
          <g key={c}>
            <rect x="2" y={8 + i * 13} width="156" height="6" fill="var(--rule)" />
            <rect
              x="2"
              y={8 + i * 13}
              width="156"
              height="6"
              fill={`var(${c})`}
              style={{
                transformBox: "fill-box",
                transformOrigin: "left center",
                animation: "cr-typeline 1.8s cubic-bezier(.4,0,.2,1) infinite alternate",
              }}
            />
          </g>
        ))}
      </svg>
    );

  return (
    <svg ref={gate} viewBox="0 0 160 64" className="w-full">
      <rect x="1" y="10" width="158" height="44" fill="none" stroke="var(--rule)" />
      <circle cx="16" cy="32" r="4" fill="var(--fmt-social)" className="anim-pulse" />
      <text x="28" y="29" fill="var(--ink-2)" fontFamily={MONO} fontSize="9">
        COMPLETED
      </text>
      <text x="28" y="42" fill="var(--ink-3)" fontFamily={MONO} fontSize="8">
        4 pieces · 1 plate
      </text>
      <path d="M132 26 l8 6 l-8 6" fill="none" stroke="var(--signal)" strokeWidth="1.3" />
    </svg>
  );
}

export function Pipeline() {
  const rail = useRef<HTMLDivElement>(null);
  useRailProgress(rail);

  return (
    <section id="pipeline" className="scroll-mt-20 border-b border-rule py-20 sm:py-28">
      <div className="mx-auto max-w-340 px-5 sm:px-8">
        <SectionHead
          index="02"
          kicker="Pipeline"
          title={
            <>
              What happens between
              <br />
              the paste and the <em className="italic text-signal">post</em>.
            </>
          }
          deck="No black box. Four stages, and the only one that takes real time is the one that has to listen to the whole video."
        />

        <div ref={rail} className="relative mt-16 pl-8 sm:pl-16">
          {/* The rail, and the ink that fills it as you read down. */}
          <div className="absolute bottom-0 left-0 top-0 w-px bg-rule sm:left-6" aria-hidden="true">
            <div
              className="w-full origin-top bg-signal"
              style={{ height: "100%", transform: "scaleY(var(--rail-progress, 0))" }}
            />
          </div>

          {STAGES.map((s, i) => (
            <Reveal key={s.n} delay={i * 70}>
              <div className="relative grid grid-cols-1 gap-x-10 gap-y-6 border-b border-rule py-9 last:border-0 lg:grid-cols-12">
                {/* Tick from the rail to the stage. The rail sits at container
                    x=0 on mobile and x=24px from sm up, so both offsets are
                    measured back from the content edge (pl-8 / pl-16). */}
                <span
                  className="absolute -left-8 top-10 h-px w-8 bg-rule sm:-left-10 sm:w-10"
                  aria-hidden="true"
                />
                <span
                  className="absolute -left-[35px] top-[37px] h-1.5 w-1.5 bg-paper ring-1 ring-signal sm:-left-[43px]"
                  aria-hidden="true"
                />

                <div className="lg:col-span-3">
                  <div className="flex items-baseline gap-3">
                    <span className="display text-4xl">{s.n}</span>
                    <h3 className="text-lg font-medium tracking-tight">{s.title}</h3>
                  </div>
                  <span className="label mt-2 block text-ink-3">{s.time}</span>
                </div>

                <p className="max-w-xl text-[14.5px] leading-[1.75] text-ink-2 lg:col-span-6">
                  {s.body}
                </p>

                <div className="border border-rule bg-surface p-3 lg:col-span-3">
                  <Figure stage={i} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
