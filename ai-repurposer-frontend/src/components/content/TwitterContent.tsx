"use client";
import { useState } from "react";
import { parseTweets } from "./parsers";

export function TwitterContent({ body }: { body: string }) {
  const tweets = parseTweets(body);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyOne = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text.trim());
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <ol className="border-t border-rule">
      {tweets.map((tweet, idx) => {
        const text = tweet.trim();
        const over = text.length > 280;
        const tight = !over && text.length > 260;
        return (
          <li key={idx} className="group flex gap-4 border-b border-rule py-4">
            <span className="label w-8 shrink-0 pt-1 text-fmt-thread">
              {idx + 1}/{tweets.length}
            </span>

            <div className="min-w-0 flex-1">
              {/* Per-post rather than inherited: one English post inside an
                  Arabic thread should still resolve on its own. */}
              <p dir="auto" className="whitespace-pre-wrap text-[14.5px] leading-[1.7] text-ink">
                {text}
              </p>
              <div className="mt-2.5 flex items-center gap-3">
                <span
                  className={`label tabular-nums ${
                    over ? "text-signal" : tight ? "text-fmt-blog" : "text-ink-3"
                  }`}
                >
                  {text.length} / 280
                </span>
                {over && <span className="label text-signal">over the line</span>}
                <span className="h-px flex-1 bg-rule" />
                <button
                  onClick={() => copyOne(text, idx)}
                  className="label text-ink-3 opacity-0 transition-all hover:text-signal focus-visible:opacity-100 group-hover:opacity-100"
                  aria-label={`Copy post ${idx + 1}`}
                >
                  {copiedIdx === idx ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
