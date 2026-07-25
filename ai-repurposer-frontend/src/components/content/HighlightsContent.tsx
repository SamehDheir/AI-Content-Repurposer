"use client";
import { parseHighlights } from "./parsers";

// One entry per accent, each carrying both themes. Named fields replace the
// previous `color.split(" ")[n]` indexing into a space-joined triple.
const ACCENTS = [
  {
    from: "from-indigo-100 dark:from-indigo-500/20",
    border: "border-indigo-300 dark:border-indigo-500/30",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  {
    from: "from-violet-100 dark:from-violet-500/20",
    border: "border-violet-300 dark:border-violet-500/30",
    text: "text-violet-600 dark:text-violet-400",
  },
  {
    from: "from-sky-100 dark:from-sky-500/20",
    border: "border-sky-300 dark:border-sky-500/30",
    text: "text-sky-600 dark:text-sky-400",
  },
  {
    from: "from-emerald-100 dark:from-emerald-500/20",
    border: "border-emerald-300 dark:border-emerald-500/30",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  {
    from: "from-amber-100 dark:from-amber-500/20",
    border: "border-amber-300 dark:border-amber-500/30",
    text: "text-amber-600 dark:text-amber-400",
  },
];

interface Props { body: string }

export function HighlightsContent({ body }: Props) {
  const items = parseHighlights(body);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const accent = ACCENTS[idx % ACCENTS.length];
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl bg-gradient-to-r ${accent.from} to-transparent border ${accent.border} hover:brightness-110 transition-all duration-200`}
          >
            <div className="flex items-start gap-3">
              <span className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold bg-white/60 dark:bg-black/20 ${accent.text}`}>
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-semibold mb-1 leading-snug ${accent.text}`}>
                  {item.title}
                </h3>
                <p className={"text-sm leading-relaxed text-gray-700 dark:text-zinc-400"}>{item.body}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}