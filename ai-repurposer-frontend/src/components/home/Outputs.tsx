"use client";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "./SectionHead";

/* Specimen copy. Everything below is a worked example of one video —
   "Why your side project never ships" — run through the four formats, so the
   page shows the actual artefacts rather than describing them. */

const THREAD = [
  "Most side projects don't die of bad ideas. They die in an unpublished drafts folder.",
  "340 commits. Zero readers. The work was real — the distribution never happened.",
  "Here's the loop that fixed it, and it starts with something you already made.",
];

const HIGHLIGHTS = [
  ["The drafts problem", "Work that never leaves your machine cannot compound."],
  ["Ship the ugly one", "A rough post that exists beats a perfect one that doesn't."],
  ["One channel first", "Add the second only once the first runs without you."],
];

const HASHTAGS = ["#buildinpublic", "#sideprojects", "#shipit"];

function Panel({
  index,
  name,
  meta,
  ink,
  children,
  delay,
}: {
  index: string;
  name: string;
  meta: string;
  ink: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <Reveal delay={delay} className="group h-full">
      <article
        className="panel relative flex h-full flex-col border border-rule bg-surface group-hover:-translate-y-1"
        style={{ ["--panel-ink" as string]: ink }}
      >
        <span
          className="block h-[3px] w-full transition-all duration-300 group-hover:h-1.5"
          style={{ background: ink }}
        />
        <header className="flex items-center justify-between border-b border-rule px-5 py-3.5">
          <span className="flex items-baseline gap-2.5">
            <span className="label text-ink-3">{index}</span>
            <span className="label" style={{ color: ink }}>
              {name}
            </span>
          </span>
          <span className="label text-ink-3">{meta}</span>
        </header>
        <div className="flex-1 px-5 py-5">{children}</div>
      </article>
    </Reveal>
  );
}

export function Outputs() {
  return (
    <section id="outputs" className="border-b border-rule py-20 sm:py-28">
      <div className="mx-auto max-w-340 px-5 sm:px-8">
        <SectionHead
          index="01"
          kicker="Outputs"
          title={
            <>
              Four finished pieces,
              <br />
              <em className="italic text-ink-3">not four prompts.</em>
            </>
          }
          deck="One 12-minute video, run through the shop. This is the actual shape of what lands in your dashboard — copy it out and post it."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Thread */}
          <Panel index="A" name="Thread" meta="9 posts" ink="var(--fmt-thread)" delay={0}>
            <ol className="space-y-3">
              {THREAD.map((t, i) => (
                <li key={i} className="flex gap-3 border-b border-rule pb-3 last:border-0 last:pb-0">
                  <span className="label mt-1 shrink-0 text-fmt-thread">{i + 1}/</span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] leading-[1.6] text-ink-2">{t}</p>
                    <span className="label mt-1.5 block text-ink-3">{t.length} / 280</span>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          {/* Blog */}
          <Panel index="B" name="Blog post" meta="1,240 words" ink="var(--fmt-blog)" delay={90}>
            <h3 className="display mb-3 text-2xl leading-tight">Why your side project never ships</h3>
            <p className="text-[13.5px] leading-[1.75] text-ink-2">
              <span className="display float-left mr-2 mt-1 text-[2.6rem] leading-[0.78] text-fmt-blog">
                T
              </span>
              he idea was never the problem. Six months in, the repository holds three hundred
              commits and not one of them has been read by anybody but you. The work is done. The
              publishing is not.
            </p>
            <p className="mt-3 text-[13.5px] leading-[1.75] text-ink-2">
              What follows is the loop that closed that gap — three habits, in the order they need
              to arrive.
            </p>
          </Panel>

          {/* Facebook */}
          <Panel index="C" name="Facebook" meta="1 post" ink="var(--fmt-social)" delay={140}>
            <div className="mb-3 border-l-2 border-fmt-social bg-surface-2 px-4 py-3">
              <span className="label mb-1.5 block text-fmt-social">Hook</span>
              <p className="text-[13.5px] font-medium leading-[1.6] text-ink">
                Six months of commits. Zero launches. Sound familiar?
              </p>
            </div>
            <p className="text-[13.5px] leading-[1.7] text-ink-2">
              I went back through every project I quietly abandoned and found the same three habits
              underneath all of them. The fix took a weekend.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {HASHTAGS.map((h) => (
                <span key={h} className="slug border border-rule px-2 py-1 text-[11px] text-ink-3">
                  {h}
                </span>
              ))}
            </div>
          </Panel>

          {/* Highlights */}
          <Panel index="D" name="Highlights" meta="5 marks" ink="var(--fmt-marks)" delay={190}>
            <ul className="space-y-3.5">
              {HIGHLIGHTS.map(([title, body], i) => (
                <li key={title} className="flex gap-3.5">
                  <span className="display shrink-0 text-2xl leading-none text-fmt-marks">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h4 className="text-[13.5px] font-semibold text-ink">{title}</h4>
                    <p className="mt-0.5 text-[13px] leading-[1.6] text-ink-2">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* The optional plate */}
        <Reveal delay={120} className="mt-5 block">
          <div className="flex flex-col items-stretch gap-6 border border-rule bg-surface p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="hatch relative flex h-32 w-full shrink-0 items-center justify-center border border-rule sm:w-52">
              <span className="label bg-paper px-2 py-1 text-ink-3">Plate 01</span>
            </div>
            <div>
              <span className="label text-ink-3">E · Featured image</span>
              <h3 className="display mt-2 text-2xl sm:text-3xl">
                And a plate to run alongside it.
              </h3>
              <p className="mt-2 max-w-xl text-[13.5px] leading-[1.7] text-ink-2">
                Ask for it from the viewer and the model writes its own art direction from the
                transcript, then renders a featured image sized for the post. Generated on request,
                never on the meter.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
