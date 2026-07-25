"use client";
import { useState } from "react";
import { extractHashtags, extractHook } from "./parsers";

export function FacebookContent({ body }: { body: string }) {
  const hashtags = extractHashtags(body);
  const hook = extractHook(body);
  const main = body.replace(hook, "").replace(/#\w+/g, "").trim();
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const copyTag = async (tag: string) => {
    await navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(hashtags.join(" "));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  return (
    <div>
      {hook && (
        <div className="border-l-2 border-fmt-social bg-surface px-5 py-4">
          <span className="label mb-2 block text-fmt-social">Hook</span>
          <p className="text-[16px] font-medium leading-[1.6] text-ink">{hook}</p>
        </div>
      )}

      <p className="mt-6 whitespace-pre-wrap text-[14.5px] leading-[1.8] text-ink-2">{main}</p>

      {hashtags.length > 0 && (
        <div className="mt-8 border-t border-rule pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="label text-ink-3">Hashtags</span>
            <button
              onClick={copyAll}
              className="label text-ink-3 transition-colors hover:text-signal"
              aria-label="Copy all hashtags"
            >
              {copiedAll ? "Copied ✓" : "Copy all"}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hashtags.map((tag) => (
              <button
                key={tag}
                onClick={() => copyTag(tag)}
                className="slug border border-rule px-2.5 py-1 text-[12px] text-ink-2 transition-colors hover:border-fmt-social hover:text-fmt-social"
              >
                {copiedTag === tag ? "copied ✓" : tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
