"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { parseTweets } from "./parsers";

interface Props { body: string }

export function TwitterContent({ body }: Props) {
  const tweets = parseTweets(body);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyTweet = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text.trim());
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="space-y-3">
      {tweets.map((tweet, idx) => (
        <div
          key={idx}
          className="group relative p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20 transition-all duration-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="shrink-0 w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center mt-0.5">
                {idx + 1}
              </span>
              <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {tweet.trim()}
              </p>
            </div>
            <button
              onClick={() => copyTweet(tweet, idx)}
              className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-all"
            >
              {copiedIdx === idx
                ? <Check size={13} className="text-emerald-400" />
                : <Copy size={13} />
              }
            </button>
          </div>
          <div className="mt-2 ml-9 flex items-center justify-between">
            <span className={`text-xs font-medium tabular-nums ${
              tweet.length > 260 ? "text-red-400" : "text-zinc-600"
            }`}>
              {tweet.length} / 280
            </span>
            {tweet.length > 260 && (
              <span className="text-xs text-red-400/80">Too long</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}