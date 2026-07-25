"use client";
import { parseHighlights } from "./parsers";

export function HighlightsContent({ body }: { body: string }) {
  const items = parseHighlights(body);

  return (
    <ul className="border-t border-rule">
      {items.map((item, idx) => (
        <li key={idx} className="flex gap-5 border-b border-rule py-5">
          <span className="display shrink-0 text-4xl leading-none text-fmt-marks">
            {String(idx + 1).padStart(2, "0")}
          </span>
          <div dir="auto" className="min-w-0">
            <h3 className="display text-xl leading-snug text-ink">{item.title}</h3>
            <p className="mt-1.5 text-[14px] leading-[1.75] text-ink-2">{item.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
