"use client";
import { Reveal } from "@/src/components/ui/Reveal";

interface Props {
  index: string;
  kicker: string;
  title: React.ReactNode;
  deck?: string;
}

/** The recurring section masthead: a plate number, a kicker, a serif title. */
export function SectionHead({ index, kicker, title, deck }: Props) {
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-6 border-t border-rule pt-8 lg:grid-cols-12">
      <Reveal className="lg:col-span-3">
        <div className="flex items-baseline gap-3 lg:sticky lg:top-24">
          <span className="display text-5xl text-signal">{index}</span>
          <span className="label text-ink-3">{kicker}</span>
        </div>
      </Reveal>

      <div className="lg:col-span-9">
        <Reveal delay={80}>
          <h2 className="display display-xl text-[clamp(2.1rem,4.6vw,3.8rem)]">{title}</h2>
        </Reveal>
        {deck && (
          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-[15px] leading-[1.75] text-ink-2">{deck}</p>
          </Reveal>
        )}
      </div>
    </div>
  );
}
