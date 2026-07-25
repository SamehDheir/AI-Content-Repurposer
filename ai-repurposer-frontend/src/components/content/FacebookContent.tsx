"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { extractHashtags, extractHook } from "./parsers";

interface Props { body: string }

export function FacebookContent({ body }: Props) {
  const hashtags = extractHashtags(body);
  const hook = extractHook(body);
  const mainBody = body.replace(hook, "").replace(/#\w+/g, "").trim();
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const copyTag = async (tag: string) => {
    await navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  const copyAllTags = async () => {
    await navigator.clipboard.writeText(hashtags.join(" "));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Hook */}
      {hook && (
        <div className={"relative p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-300 dark:border-indigo-500/20"}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">Hook</span>
          </div>
          <p className={"text-sm font-medium leading-relaxed text-gray-900 dark:text-zinc-100"}>{hook}</p>
        </div>
      )}

      {/* Body */}
      <div className={"p-4 rounded-xl border bg-gray-50 border-gray-200 dark:bg-white/5 dark:border-white/10"}>
        <p className={"text-sm leading-[1.8] whitespace-pre-wrap text-gray-700 dark:text-zinc-300"}>{mainBody}</p>
      </div>

      {/* Hashtags */}
      {hashtags.length > 0 && (
        <div className={"p-4 rounded-xl border bg-gray-50 border-gray-200 dark:bg-white/5 dark:border-white/10"}>
          <div className="flex items-center justify-between mb-3">
            <span className={"text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-zinc-500"}>Hashtags</span>
            <button
              onClick={copyAllTags}
              className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-600 transition-colors"
              aria-label="Copy all hashtags"
            >
              {copiedAll ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              {copiedAll ? "Copied!" : "Copy all"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag) => (
              <button
                key={tag}
                onClick={() => copyTag(tag)}
                className={"group flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 dark:bg-zinc-800 dark:border-white/10 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10"}
              >
                <span className={"text-xs transition-colors text-gray-600 group-hover:text-indigo-500 dark:text-zinc-400 dark:group-hover:text-indigo-300"}>{tag}</span>
                {copiedTag === tag
                  ? <Check size={9} className="text-emerald-500" />
                  : <Copy size={9} className={"opacity-0 group-hover:opacity-100 transition-all text-gray-400 group-hover:text-indigo-500 dark:text-zinc-600 dark:group-hover:text-indigo-400"} />
                }
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}