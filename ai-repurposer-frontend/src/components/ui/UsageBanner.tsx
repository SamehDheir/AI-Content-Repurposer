"use client";
import { useEffect, useState } from "react";
import { api, type Me } from "@/lib/api";

/**
 * The meter on the desk: how much of this month's stock is left. Drawn as
 * discrete slots rather than a percentage bar, because on the free plan the
 * whole month is a single slot and a 100%-full bar reads as an error.
 */
export function UsageBanner() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    api.getMe().then(setMe).catch(() => {});
  }, []);

  if (!me) {
    return (
      <span className="label inline-block h-4 w-40 animate-pulse bg-rule" aria-hidden="true" />
    );
  }

  if (me.plan === "PRO") {
    return (
      <div className="flex items-center gap-3">
        <span className="label text-ink-3">Stock</span>
        <span className="label border border-signal px-2 py-1 text-signal">Pro</span>
        <span className="label text-ink-3">Unmetered</span>
      </div>
    );
  }

  const { used, limit, remaining, resetsAt } = me.usage;
  const slots = limit ?? 1;
  const spent = remaining === 0;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="label text-ink-3">Stock</span>
      <span className="label border border-rule px-2 py-1 text-ink-2">Free</span>

      <span className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: Math.min(slots, 12) }, (_, i) => (
          <span
            key={i}
            className={`h-3 w-2.5 border transition-colors duration-500 ${
              i < used
                ? spent
                  ? "border-signal bg-signal"
                  : "border-ink-2 bg-ink-2"
                : "border-rule-strong"
            }`}
          />
        ))}
      </span>

      <span className={`label ${spent ? "text-signal" : "text-ink-3"}`}>
        {used}/{limit} used
      </span>

      <span className="label hidden text-ink-3 sm:inline" suppressHydrationWarning>
        · resets{" "}
        {new Date(resetsAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
      </span>

      {spent && (
        <span className="text-[12.5px] leading-[1.6] text-signal">
          — next month, or go Pro.
        </span>
      )}
    </div>
  );
}
