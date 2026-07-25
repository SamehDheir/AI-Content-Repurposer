"use client";
import { Reveal } from "@/src/components/ui/Reveal";
import { SectionHead } from "./SectionHead";

/* A colophon, not a feature grid: what is actually under the floorboards. */
const SPECS: [string, string][] = [
  ["Transcript", "YouTube's own captions where they exist. Otherwise the audio is fetched and put through Whisper large-v3-turbo."],
  ["Writing", "Llama 3.1 8B Instruct, prompted once per format with the target language carried in the system message."],
  ["Languages", "Modern Standard Arabic and English. Chosen per video, not per account."],
  ["Formats", "Twitter thread · Blog post · Facebook post · Highlight reel. All four, every run."],
  ["Image", "The model writes its own art direction from the transcript, then renders a featured plate. On request only."],
  ["Delivery", "The dashboard holds an open stream and turns the row over the moment the job lands. Nothing to refresh."],
  ["Reliability", "Three attempts with exponential backoff, and the four pieces are committed together or not at all."],
  ["Accounts", "Email and password, or Google. Addresses are verified before the first sign-in."],
  ["Sessions", "HttpOnly cookies. Access tokens last fifteen minutes and are never readable from JavaScript."],
];

export function Specs() {
  return (
    <section id="specs" className="border-b border-rule py-20 sm:py-28">
      <div className="mx-auto max-w-340 px-5 sm:px-8">
        <SectionHead
          index="03"
          kicker="Specs"
          title={
            <>
              The colophon.
              <br />
              <em className="italic text-ink-3">Everything under the floor.</em>
            </>
          }
          deck="Printed matter carries a note on the paper, the press and the type. This is ours."
        />

        <dl className="mt-14 border-t border-rule">
          {SPECS.map(([term, def], i) => (
            <Reveal key={term} delay={i * 45}>
              <div className="group grid grid-cols-1 items-baseline gap-x-10 gap-y-1 border-b border-rule py-5 transition-colors hover:bg-surface sm:grid-cols-12 sm:py-4">
                <dt className="label flex items-center gap-3 text-ink-3 transition-colors group-hover:text-signal sm:col-span-3">
                  <span className="h-px w-0 bg-signal transition-all duration-300 group-hover:w-4" />
                  {term}
                </dt>
                <dd className="text-[14.5px] leading-[1.7] text-ink-2 transition-colors group-hover:text-ink sm:col-span-9">
                  {def}
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
