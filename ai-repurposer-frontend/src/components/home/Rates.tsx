"use client";
import { Reveal } from "@/src/components/ui/Reveal";
import { SectionHead } from "./SectionHead";

/* The plans differ in exactly one place — the monthly quota — so the table
   says so plainly instead of padding one column with invented differences. */
const ROWS: [string, string, string][] = [
  ["Videos a month", "1", "Unlimited"],
  ["Formats per video", "4", "4"],
  ["Languages", "Arabic · English", "Arabic · English"],
  ["Featured image", "On request", "On request"],
  ["Live status stream", "Yes", "Yes"],
  ["Edit before you copy", "Yes", "Yes"],
  ["Support", "Email", "Email, first in line"],
];

function Column({
  name,
  price,
  period,
  note,
  featured,
  cta,
  onClick,
}: {
  name: string;
  price: string;
  period: string;
  note: string;
  featured?: boolean;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div
      className={`relative flex h-full flex-col p-6 sm:p-7 ${
        featured ? "bg-surface" : ""
      }`}
    >
      {featured && (
        <span className="label absolute -top-[9px] left-6 bg-signal px-2 py-1 text-signal-ink">
          Unlimited
        </span>
      )}
      <span className="label text-ink-3">{name}</span>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="display display-xl text-6xl">{price}</span>
        <span className="label text-ink-3">{period}</span>
      </div>
      <p className="mt-4 text-[14px] leading-[1.7] text-ink-2">{note}</p>
      <button
        onClick={onClick}
        className={`label group mt-7 flex h-12 items-center justify-center gap-2 transition-all ${
          featured
            ? "bg-signal text-signal-ink hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--rule-strong)]"
            : "border border-rule-strong text-ink hover:border-signal hover:text-signal"
        }`}
      >
        {cta}
        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </button>
    </div>
  );
}

export function Rates({ onEnter }: { onEnter: () => void }) {
  return (
    <section id="rates" className="border-b border-rule py-20 sm:py-28">
      <div className="mx-auto max-w-340 px-5 sm:px-8">
        <SectionHead
          index="04"
          kicker="Rates"
          title={
            <>
              One number changes.
              <br />
              <em className="italic text-ink-3">Nothing else does.</em>
            </>
          }
          deck="Both plans run the same engines, write the same four formats and hand back the same quality. Paying only lifts the ceiling on how often you can do it."
        />

        <Reveal delay={80} className="mt-14 block">
          <div className="grid grid-cols-1 border border-rule md:grid-cols-2">
            <div className="border-b border-rule md:border-b-0 md:border-r">
              <Column
                name="Free"
                price="$0"
                period="forever"
                note="One video a month, cut into all four formats. No card, no trial clock."
                cta="Start here"
                onClick={onEnter}
              />
            </div>
            <Column
              name="Pro"
              price="$19"
              period="per month"
              note="As many videos as you can feed it. Same shop, no meter on the door."
              featured
              cta="Go unlimited"
              onClick={onEnter}
            />
          </div>
        </Reveal>

        {/* The matrix */}
        <Reveal delay={140} className="mt-6 block">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Free and Pro plans compared</caption>
            <thead>
              <tr className="border-b border-rule">
                <th className="label py-3 font-normal text-ink-3">Line item</th>
                <th className="label py-3 font-normal text-ink-3">Free</th>
                <th className="label py-3 font-normal text-signal">Pro</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, free, pro], i) => (
                <tr
                  key={label}
                  className="border-b border-rule transition-colors last:border-0 hover:bg-surface"
                >
                  <td className="py-3.5 pr-4 text-[14px] text-ink-2">{label}</td>
                  <td className="slug py-3.5 pr-4 text-[13px] text-ink-2">{free}</td>
                  <td
                    className={`slug py-3.5 text-[13px] ${i === 0 ? "text-signal" : "text-ink-2"}`}
                  >
                    {pro}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
