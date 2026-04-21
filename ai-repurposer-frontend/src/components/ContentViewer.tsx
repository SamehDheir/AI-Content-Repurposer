"use client";
import { useState } from "react";
import { type Job, type ContentType } from "@/src/lib/api";

const TABS: { key: ContentType; label: string }[] = [
  { key: "TWITTER_THREAD", label: "Twitter" },
  { key: "BLOG_POST", label: "Blog" },
  { key: "FACEBOOK_POST", label: "Facebook" },
  { key: "HIGHLIGHTS", label: "Highlights" },
];

export function ContentViewer({
  job,
  onClose,
}: {
  job: Job;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<ContentType>("TWITTER_THREAD");
  const [copied, setCopied] = useState(false);

  const body = job.generatedContent.find((c) => c.type === tab)?.body ?? "";

  const copy = async () => {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-medium text-gray-900">
            Generated content
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
            {body || "No content."}
          </pre>
        </div>

        <div className="px-6 py-4 border-t flex justify-end">
          <button
            onClick={copy}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
