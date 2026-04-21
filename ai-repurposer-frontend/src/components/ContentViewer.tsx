"use client";
import { useState, useRef } from "react";
import { type Job, type ContentType } from "@/src/lib/api";

const TABS: { key: ContentType; label: string }[] = [
  { key: "TWITTER_THREAD", label: "Twitter" },
  { key: "BLOG_POST", label: "Blog" },
  { key: "FACEBOOK_POST", label: "Facebook" },
  { key: "HIGHLIGHTS", label: "Highlights" },
];

// دالة لفصل التغريدات (مفصولة برقم مثل 1/5, 2/5, etc)
function parseTweets(text: string): string[] {
  const tweetPattern = /\(\d+\/\d+\)/g;
  const tweets = text.split(/\n\s*\n/).filter((t) => t.trim());
  return tweets;
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
  const [editedBody, setEditedBody] = useState("");
  const editableRef = useRef<HTMLDivElement>(null);

  const body = job.generatedContent.find((c) => c.type === tab)?.body ?? "";

  const tweets = tab === "TWITTER_THREAD" ? parseTweets(body) : [];

  const handleEditStart = () => {
    setEditedBody(body);
    setIsEditing(true);
  };

  const handleEditEnd = () => {
    if (editableRef.current) {
      setEditedBody(editableRef.current.innerText);
    }
    setIsEditing(false);
  };

  const copy = async () => {
    const textToCopy =
      isEditing && editableRef.current ? editableRef.current.innerText : body;
    await navigator.clipboard.writeText(textToCopy);
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
              onClick={() => {
                if (isEditing) handleEditEnd();
                setTab(t.key);
              }}
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
          {/* Twitter Thread - with visual separation */}
          {tab === "TWITTER_THREAD" && tweets.length > 0 ? (
            <div className="space-y-3">
              {tweets.map((tweet, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
                >
                  <div
                    contentEditable={isEditing}
                    onBlur={() =>
                      setEditedBody(editableRef.current?.innerText ?? body)
                    }
                    ref={isEditing && idx === 0 ? editableRef : null}
                    className={`text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans focus:outline-none ${
                      isEditing ? "bg-indigo-50 p-2 rounded cursor-text" : ""
                    }`}
                    suppressContentEditableWarning
                  >
                    {tweet.trim()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Other content types - editable */
            <div
              ref={editableRef}
              contentEditable={isEditing}
              onBlur={() =>
                setEditedBody(editableRef.current?.innerText ?? body)
              }
              className={`text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans ${
                isEditing
                  ? "bg-indigo-50 p-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[200px]"
                  : "cursor-default"
              }`}
              suppressContentEditableWarning
            >
              {body || "No content."}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <button
            onClick={isEditing ? handleEditEnd : handleEditStart}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isEditing
                ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {isEditing ? "Done" : "Edit"}
          </button>
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
