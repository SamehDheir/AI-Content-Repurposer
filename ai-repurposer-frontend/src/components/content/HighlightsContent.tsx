"use client";
import { parseHighlights } from "./parsers";

const ACCENT_COLORS = [
  "from-indigo-500/20 border-indigo-500/30 text-indigo-400",
  "from-violet-500/20 border-violet-500/30 text-violet-400",
  "from-sky-500/20 border-sky-500/30 text-sky-400",
  "from-emerald-500/20 border-emerald-500/30 text-emerald-400",
  "from-amber-500/20 border-amber-500/30 text-amber-400",
];

interface Props { body: string }

export function HighlightsContent({ body }: Props) {
  const items = parseHighlights(body);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const color = ACCENT_COLORS[idx % ACCENT_COLORS.length];
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl bg-gradient-to-r ${color.split(" ")[0]} to-transparent border ${color.split(" ")[1]} hover:brightness-110 transition-all duration-200`}
          >
            <div className="flex items-start gap-3">
              <span className={`shrink-0 w-6 h-6 rounded-lg bg-black/20 flex items-center justify-center text-xs font-bold ${color.split(" ")[2]}`}>
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-semibold ${color.split(" ")[2]} mb-1 leading-snug`}>
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{item.body}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}