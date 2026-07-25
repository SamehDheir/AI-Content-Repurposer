"use client";
import Link from "next/link";
import { Mark } from "@/src/components/brand/Mark";
import { Reveal } from "@/src/components/ui/Reveal";
import { PasteField } from "./PasteField";
import { Waveform } from "@/src/components/ui/Waveform";

export function Colophon({
  authed,
  onEnter,
}: {
  authed: boolean;
  onEnter: (url?: string) => void;
}) {
  const year = new Date().getFullYear();

  return (
    <>
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-[0.18]"
          aria-hidden="true"
        >
          <Waveform bars={90} live playhead className="h-full w-full" />
        </div>

        <div className="relative mx-auto max-w-340 px-5 sm:px-8">
          <Reveal>
            <p className="label mb-8 text-ink-3">Last page</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="display display-xl max-w-4xl text-[clamp(2.4rem,6.4vw,5rem)]">
              That video you made is
              <br />
              still <em className="italic text-signal">only a video</em>.
            </h2>
          </Reveal>
          <Reveal delay={180}>
            <p className="mt-7 max-w-xl text-[15px] leading-[1.75] text-ink-2">
              Give it a link and get the week&apos;s posts back. The first one is free, and there
              is nothing to install.
            </p>
          </Reveal>
          <Reveal delay={260}>
            <div className="mt-10 max-w-2xl">
              <PasteField authed={authed} onSubmit={onEnter} />
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-rule">
        <div className="mx-auto max-w-340 px-5 py-10 sm:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <Mark size={20} />
                <span className="display text-lg">AI Repurposer</span>
              </div>
              <p className="label mt-4 max-w-xs leading-[1.9] text-ink-3">
                Set in Newsreader and Geist.
                <br />
                Cut in {year}.
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-x-7 gap-y-3" aria-label="Footer">
              {[
                ["Outputs", "#outputs"],
                ["Pipeline", "#pipeline"],
                ["Specs", "#specs"],
                ["Rates", "#rates"],
                ["Sign in", "/login"],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="label text-ink-3 transition-colors hover:text-signal"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-rule pt-5">
            <span className="label text-ink-3">© {year} AI Repurposer</span>
            <span className="label text-ink-3">EOF</span>
          </div>
        </div>
      </footer>
    </>
  );
}
