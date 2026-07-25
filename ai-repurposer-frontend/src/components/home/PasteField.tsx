"use client";
import { useState } from "react";

export const PENDING_URL_KEY = "repurposer:pendingUrl";

interface Props {
  authed: boolean;
  onSubmit: (url?: string) => void;
  className?: string;
  compact?: boolean;
}

/**
 * The same field the dashboard uses, put on the front page so the product's
 * one input is the first thing you meet. The URL is parked in sessionStorage
 * and the composer picks it up on the other side of the login wall.
 */
export function PasteField({ authed, onSubmit, className = "", compact = false }: Props) {
  const [url, setUrl] = useState("");
  const [focused, setFocused] = useState(false);

  const trimmed = url.trim();
  const looksWrong = trimmed.length > 8 && !/youtu\.?be/i.test(trimmed);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trimmed) {
      try {
        sessionStorage.setItem(PENDING_URL_KEY, trimmed);
      } catch {
        // Private mode or a blocked store — the field is a convenience, not a
        // requirement, so carry on to the desk regardless.
      }
    }
    onSubmit(trimmed || undefined);
  };

  return (
    <form onSubmit={submit} className={className}>
      <div
        className={`flex items-stretch border transition-colors duration-200 ${
          focused ? "border-signal" : "border-rule-strong"
        }`}
      >
        <span className="label hidden items-center gap-2 border-r border-rule px-4 text-ink-3 sm:flex">
          <span className="anim-blink h-2.5 w-[3px] bg-signal" aria-hidden="true" />
          Source
        </span>
        <div className="relative flex flex-1 items-center">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="https://www.youtube.com/watch?v="
            aria-label="YouTube video URL"
            spellCheck={false}
            className={`slug w-full bg-transparent px-4 text-[13px] text-ink outline-none placeholder:text-ink-3 ${
              compact ? "h-11" : "h-13"
            }`}
          />
        </div>
        <button
          type="submit"
          className={`label group flex items-center gap-2 bg-signal px-5 text-signal-ink transition-colors hover:bg-ink hover:text-paper ${
            compact ? "h-11" : "h-13"
          }`}
        >
          {authed ? "Run it" : "Cut it"}
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </button>
      </div>

      {/* Sentence case: these read as a note to the reader, not as a slug. */}
      <p className="mt-3 flex items-center gap-2 text-[12.5px] leading-[1.6] text-ink-3">
        {looksWrong ? (
          <span className="text-signal">Expects a YouTube link — we&apos;ll try anyway.</span>
        ) : authed ? (
          <>
            <span className="h-1.5 w-1.5 shrink-0 bg-fmt-social" />
            Signed in — this drops straight onto your desk.
          </>
        ) : (
          <>
            <span className="h-1.5 w-1.5 shrink-0 bg-signal" />
            Free plan: one video a month, no card.
          </>
        )}
      </p>
    </form>
  );
}
