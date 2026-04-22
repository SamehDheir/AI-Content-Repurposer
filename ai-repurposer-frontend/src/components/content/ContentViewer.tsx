"use client";
import { useState, useCallback } from "react";
import { Copy, Check, X } from "lucide-react";
import { type Job, type ContentType } from "@/src/lib/api";
import { TABS } from "./types";
import { TwitterContent }    from "./TwitterContent";
import { BlogContent }       from "./BlogContent";
import { FacebookContent }   from "./FacebookContent";
import { HighlightsContent } from "./HighlightsContent";

interface Props {
  job:     Job;
  onClose: () => void;
}

export function ContentViewer({ job, onClose }: Props) {
  const [tab, setTab]         = useState<ContentType>("TWITTER_THREAD");
  const [copied, setCopied]   = useState(false);
  const [editedBodies, setEditedBodies] = useState<Partial<Record<ContentType, string>>>({});

  const getBody = (t: ContentType) =>
    editedBodies[t] ?? job.generatedContent.find((c) => c.type === t)?.body ?? "";

  const body = getBody(tab);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBlogEdit = useCallback((val: string) => {
    setEditedBodies((prev) => ({ ...prev, BLOG_POST: val }));
  }, []);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div
        className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--cv-bg, #141416)", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle top glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent pointer-events-none" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-indigo-500/70" />
            <span className="text-sm font-semibold text-zinc-100 tracking-tight">
              Generated content
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 px-5 pt-3 pb-0 border-b border-white/8">
          {TABS.map((t) => {
            const hasContent = !!getBody(t.key);
            const isActive   = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                disabled={!hasContent}
                className={`relative flex items-center gap-1.5 px-3 py-2 mb-[-1px] text-xs font-medium transition-all rounded-t-lg ${
                  isActive
                    ? "text-zinc-100 bg-white/8 border border-white/10 border-b-[var(--cv-bg,#141416)]"
                    : hasContent
                    ? "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                    : "text-zinc-700 cursor-not-allowed"
                }`}
              >
                <span className="text-[11px] opacity-70">{t.icon}</span>
                {t.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Content area ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
          {!body ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-zinc-600">No content available.</p>
            </div>
          ) : (
            <>
              {tab === "TWITTER_THREAD" && <TwitterContent body={body} />}
              {tab === "BLOG_POST"      && <BlogContent body={body} onBodyChange={handleBlogEdit} />}
              {tab === "FACEBOOK_POST"  && <FacebookContent body={body} />}
              {tab === "HIGHLIGHTS"     && <HighlightsContent body={body} />}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/8 bg-white/3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
            <span className="text-xs text-zinc-600">
              {body.length.toLocaleString()} chars
            </span>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              copied
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
            }`}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy all"}
          </button>
        </div>
      </div>
    </div>
  );
}