"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Zap } from "lucide-react";

interface MeResponse {
  plan: "FREE" | "PRO";
  usage: {
    used:      number;
    limit:     number | null;
    remaining: number | null;
    resetsAt:  string;
  };
}

export function UsageBanner() {
  const [data, setData] = useState<MeResponse | null>(null);

  useEffect(() => {
    api.getMe().then(setData).catch(() => {});
  }, []);

  if (!data || data.plan === "PRO") return null;

  const { used, limit, remaining, resetsAt } = data.usage;
  const pct      = limit ? Math.min((used / limit) * 100, 100) : 0;
  const isLimit  = remaining === 0;
  const isWarn   = !isLimit && remaining !== null && remaining <= 2;

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      isLimit ? "border-red-500/30 bg-red-500/8"
      : isWarn ? "border-amber-500/30 bg-amber-500/8"
      : "border-white/10 bg-white/5"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
            isLimit ? "bg-red-500/20" : isWarn ? "bg-amber-500/20" : "bg-zinc-700"
          }`}>
            <Zap size={11} className={isLimit ? "text-red-400" : isWarn ? "text-amber-400" : "text-zinc-400"} />
          </div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Free plan
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold tabular-nums ${
            isLimit ? "text-red-400" : isWarn ? "text-amber-400" : "text-zinc-400"
          }`}>
            {used} / {limit}
          </span>
          {!isLimit && (
            <span className="text-xs text-zinc-600">
              resets {new Date(resetsAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </div>

      {/* Progress track */}
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isLimit ? "bg-red-500"
            : isWarn ? "bg-amber-500"
            : "bg-indigo-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {isLimit && (
        <p className="mt-2 text-xs text-red-400/80">
          Monthly limit reached. Upgrade to Pro for unlimited videos.
        </p>
      )}
    </div>
  );
}