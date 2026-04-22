"use client";
import { useEffect, useState } from "react";
import { api } from "@/src/lib/api";

interface Usage {
  plan: "FREE" | "PRO";
  usage: {
    used: number;
    limit: number | null;
    remaining: number | null;
    resetsAt: string;
  };
}

export function UsageBanner() {
  const [data, setData] = useState<Usage | null>(null);

  useEffect(() => {
    api
      .getMe()
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || data.plan === "PRO") return null;

  const { used, limit, remaining, resetsAt } = data.usage;
  const pct = limit ? (used / limit) * 100 : 0;
  const isWarn = remaining !== null && remaining <= 2;
  const isLimit = remaining === 0;

  return (
    <div
      className={`rounded-xl border p-4 ${isLimit ? "border-red-200 bg-red-50" : isWarn ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-white"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Monthly usage — Free plan
        </span>
        <span
          className={`text-sm font-medium ${isLimit ? "text-red-600" : isWarn ? "text-amber-600" : "text-gray-600"}`}
        >
          {used} / {limit} videos
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isLimit ? "bg-red-500" : isWarn ? "bg-amber-500" : "bg-indigo-500"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400">
          Resets {new Date(resetsAt).toLocaleDateString()}
        </span>
        {isLimit && (
          <span className="text-xs font-medium text-red-600">
            Limit reached — upgrade to continue
          </span>
        )}
      </div>
    </div>
  );
}
