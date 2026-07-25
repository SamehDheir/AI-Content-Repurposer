"use client";
import { useTheme } from "@/contexts/ThemeContext";
import { parseHighlights } from "./parsers";

const DARK_COLORS = [
  "from-indigo-500/20 border-indigo-500/30 text-indigo-400",
  "from-violet-500/20 border-violet-500/30 text-violet-400",
  "from-sky-500/20 border-sky-500/30 text-sky-400",
  "from-emerald-500/20 border-emerald-500/30 text-emerald-400",
  "from-amber-500/20 border-amber-500/30 text-amber-400",
];

const LIGHT_COLORS = [
  "from-indigo-100 border-indigo-300 text-indigo-600",
  "from-violet-100 border-violet-300 text-violet-600",
  "from-sky-100 border-sky-300 text-sky-600",
  "from-emerald-100 border-emerald-300 text-emerald-600",
  "from-amber-100 border-amber-300 text-amber-600",
];

interface Props { body: string }

export function HighlightsContent({ body }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const items = parseHighlights(body);
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const color = colors[idx % colors.length];
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl bg-gradient-to-r ${color.split(" ")[0]} to-transparent border ${color.split(" ")[1]} hover:brightness-110 transition-all duration-200`}
          >
            <div className="flex items-start gap-3">
              <span className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${isDark ? 'bg-black/20' : 'bg-white/60'} ${color.split(" ")[2]}`}>
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-semibold mb-1 leading-snug ${color.split(" ")[2]}`}>
                  {item.title}
                </h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-gray-700'}`}>{item.body}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}