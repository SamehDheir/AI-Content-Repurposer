"use client";
import { useState, useRef, useEffect } from "react";
import { type Job, type ContentType } from "@/src/lib/api";
import { Check, Copy, Zap, Heart, Lightbulb } from "lucide-react";

const TABS: { key: ContentType; label: string }[] = [
  { key: "TWITTER_THREAD", label: "Twitter" },
  { key: "BLOG_POST", label: "Blog" },
  { key: "FACEBOOK_POST", label: "Facebook" },
  { key: "HIGHLIGHTS", label: "Highlights" },
];

// دالة لفصل التغريدات
function parseTweets(text: string): string[] {
  return text.split(/\n\s*\n/).filter((t) => t.trim());
}

// دالة لاستخراج الـ Hashtags
function extractHashtags(text: string): string[] {
  const regex = /#\w+/g;
  return (text.match(regex) || []).filter(
    (tag, idx, arr) => arr.indexOf(tag) === idx,
  );
}

// دالة لاستخراج Hook (أول فقرة)
function extractHook(text: string): string {
  const lines = text.split(/\n/).filter((l) => l.trim());
  return lines[0] || "";
}

// دالة لمعالجة Blog - تحويل Markdown-style إلى HTML
function renderBlogContent(text: string) {
  return text.split(/\n\n+/).map((para, idx) => {
    // عناوين بصيغة # أو ##
    if (para.startsWith("## ")) {
      return (
        <h2 key={idx} className="text-xl font-bold text-gray-900 mt-6 mb-3">
          {para.replace(/^## /, "")}
        </h2>
      );
    }
    if (para.startsWith("# ")) {
      return (
        <h1 key={idx} className="text-2xl font-bold text-gray-950 mt-8 mb-4">
          {para.replace(/^# /, "")}
        </h1>
      );
    }
    // نقاط (bullets)
    if (para.startsWith("- ") || para.startsWith("• ")) {
      return (
        <ul
          key={idx}
          className="list-disc list-inside space-y-2 my-4 text-gray-800"
        >
          {para.split(/\n/).map(
            (item, i) =>
              item.trim() && (
                <li key={i} className="leading-relaxed">
                  {item.replace(/^[-•]\s*/, "")}
                </li>
              ),
          )}
        </ul>
      );
    }
    // فقرات عادية
    return (
      <p key={idx} className="text-gray-800 leading-relaxed mb-4">
        {para}
      </p>
    );
  });
}

// دالة معالجة Highlights
function parseHighlights(text: string): { title: string; content: string }[] {
  const items = text.split(/\n(?=[•\-\d])/);
  return items.map((item) => {
    const match = item.match(/^[•\-\d]+\.\s*(.+?)\s*[:-]/);
    const title = match ? match[1] : "Point";
    const content = item.replace(/^[•\-\d]+\.\s*/, "").trim();
    return { title, content };
  });
}

export function ContentViewer({
  job,
  onClose,
}: {
  job: Job;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<ContentType>("TWITTER_THREAD");
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const editableRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState("");
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });

  const body = job.generatedContent.find((c) => c.type === tab)?.body ?? "";
  const tweets = tab === "TWITTER_THREAD" ? parseTweets(body) : [];
  const hashtags = tab === "FACEBOOK_POST" ? extractHashtags(body) : [];
  const hook = tab === "FACEBOOK_POST" ? extractHook(body) : "";
  const highlights = tab === "HIGHLIGHTS" ? parseHighlights(body) : [];

  const handleEditStart = () => {
    setIsEditing(true);
  };

  const handleEditEnd = () => {
    setIsEditing(false);
  };

  // معالجة text selection و floating toolbar
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(selection.toString());
      setToolbarPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 50,
      });
    }
  };

  const copy = async () => {
    const textToCopy = editableRef.current
      ? editableRef.current.innerText
      : body;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  const copyHashtags = async () => {
    await navigator.clipboard.writeText(hashtags.join(" "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Generated Content
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                if (isEditing) handleEditEnd();
                setTab(t.key);
              }}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-indigo-600 text-white border-b-2 border-indigo-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area with Custom Scrollbar */}
        <div
          className="flex-1 overflow-y-auto px-6 py-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-600"
          onMouseUp={handleTextSelection}
        >
          {/* Twitter Thread */}
          {tab === "TWITTER_THREAD" && tweets.length > 0 ? (
            <div className="space-y-4">
              {tweets.map((tweet, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:border-blue-400 transition-all"
                >
                  <div className="text-xs text-blue-600 font-semibold mb-2">
                    {idx + 1} / {tweets.length}
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {tweet.trim()}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {/* Blog Post */}
          {tab === "BLOG_POST" ? (
            <div
              ref={editableRef}
              contentEditable={isEditing}
              suppressContentEditableWarning
              onMouseUp={handleTextSelection}
              className={`prose prose-sm max-w-none dark:prose-invert ${
                isEditing
                  ? "bg-indigo-50 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  : ""
              }`}
              style={{
                fontSize: "0.9375rem",
                lineHeight: "1.75",
              }}
            >
              {!isEditing ? renderBlogContent(body) : body || "No content."}
            </div>
          ) : null}

          {/* Facebook Post */}
          {tab === "FACEBOOK_POST" ? (
            <div
              ref={editableRef}
              contentEditable={isEditing}
              suppressContentEditableWarning
              onMouseUp={handleTextSelection}
              className={`space-y-4 ${
                isEditing
                  ? "bg-indigo-50 p-4 rounded-lg focus:outline-none"
                  : ""
              }`}
            >
              {/* Hook Section - Highlighted */}
              {hook && (
                <div className="p-4 rounded-lg bg-blue-50 border-l-4 border-blue-500">
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                    Hook 🎯
                  </div>
                  <p className="text-sm font-medium text-gray-900 leading-relaxed">
                    {hook}
                  </p>
                </div>
              )}

              {/* Main Content */}
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {body.replace(hook, "").trim()}
              </div>

              {/* Hashtags Container */}
              {hashtags.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    Hashtags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                        onClick={() => {
                          navigator.clipboard.writeText(tag);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1000);
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={copyHashtags}
                    className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Copy all hashtags
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Highlights */}
          {tab === "HIGHLIGHTS" && highlights.length > 0 ? (
            <div className="space-y-3">
              {highlights.map((item, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-indigo-500 pl-4 py-2 hover:bg-gray-50 transition-colors rounded-r-lg"
                >
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wide">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed mt-1">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {body &&
            ![
              tab === "TWITTER_THREAD",
              tab === "BLOG_POST",
              tab === "FACEBOOK_POST",
              tab === "HIGHLIGHTS",
            ].some(Boolean) && (
              <div
                ref={editableRef}
                contentEditable={isEditing}
                suppressContentEditableWarning
                className={`text-sm text-gray-800 leading-relaxed whitespace-pre-wrap ${
                  isEditing
                    ? "bg-indigo-50 p-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[200px]"
                    : ""
                }`}
              >
                {body}
              </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
          <button
            onClick={isEditing ? handleEditEnd : handleEditStart}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isEditing
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {isEditing ? "✓ Done" : "✏️ Edit"}
          </button>
          <button
            onClick={copy}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              copied
                ? "bg-green-600 text-white"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {copied ? (
              <>
                <Check size={16} /> Copied!
              </>
            ) : (
              <>
                <Copy size={16} /> Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
