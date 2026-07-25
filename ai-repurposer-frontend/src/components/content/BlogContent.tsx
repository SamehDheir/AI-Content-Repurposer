"use client";
import { useRef, useState } from "react";

interface Props {
  body: string;
  onBodyChange?: (val: string) => void;
}

function renderBlog(text: string) {
  return text.split(/\n\n+/).map((para, idx) => {
    if (para.startsWith("# "))
      return <h1 key={idx} className={"text-2xl font-bold mt-8 mb-4 leading-tight text-gray-900 dark:text-zinc-50"}>{para.replace(/^# /, "")}</h1>;
    if (para.startsWith("## "))
      return <h2 key={idx} className={"text-lg font-semibold mt-6 mb-3 leading-snug text-gray-800 dark:text-zinc-100"}>{para.replace(/^## /, "")}</h2>;
    if (para.startsWith("### "))
      return <h3 key={idx} className={"text-base font-semibold mt-4 mb-2 text-gray-700 dark:text-zinc-200"}>{para.replace(/^### /, "")}</h3>;
    if (para.match(/^[-•*]\s/m))
      return (
        <ul key={idx} className="my-3 space-y-1.5 pl-1">
          {para.split("\n").filter(Boolean).map((line, i) => (
            <li key={i} className={"flex gap-2 text-sm leading-relaxed text-gray-700 dark:text-zinc-300"}>
              <span className={"mt-1 shrink-0 text-gray-400 dark:text-zinc-500"}>–</span>
              <span>{line.replace(/^[-•*]\s*/, "")}</span>
            </li>
          ))}
        </ul>
      );
    if (para.match(/^\d+\.\s/m))
      return (
        <ol key={idx} className="my-3 space-y-1.5 pl-1 list-none">
          {para.split("\n").filter(Boolean).map((line, i) => (
            <li key={i} className={"flex gap-3 text-sm leading-relaxed text-gray-700 dark:text-zinc-300"}>
              <span className={"font-mono text-xs mt-1 shrink-0 w-4 text-gray-400 dark:text-zinc-500"}>{i + 1}.</span>
              <span>{line.replace(/^\d+\.\s*/, "")}</span>
            </li>
          ))}
        </ol>
      );
    return <p key={idx} className={"text-sm leading-[1.8] mb-3 text-gray-700 dark:text-zinc-300"}>{para}</p>;
  });
}

export function BlogContent({ body, onBodyChange }: Props) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <div>
      {editing ? (
        <div className="relative">
          <textarea
            ref={ref}
            defaultValue={body}
            onChange={(e) => onBodyChange?.(e.target.value)}
            className={"w-full min-h-[400px] rounded-xl p-4 text-sm leading-relaxed resize-none focus:outline-none focus:border-indigo-500/50 transition-all font-mono bg-gray-50 border border-gray-300 text-gray-900 focus:bg-white dark:bg-white/5 dark:border-white/15 dark:text-zinc-200 dark:focus:bg-white/8"}
            autoFocus
          />
          <button
            onClick={() => setEditing(false)}
            className="absolute top-3 right-3 px-3 py-1 text-xs bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors"
          >
            Done
          </button>
        </div>
      ) : (
        <div
          className="prose-custom cursor-text group relative"
          onClick={() => setEditing(true)}
        >
          <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className={"text-xs border px-2 py-0.5 rounded-md text-gray-500 bg-gray-100 border-gray-300 dark:text-zinc-500 dark:bg-zinc-800 dark:border-white/10"}>
              click to edit
            </span>
          </div>
          {renderBlog(body)}
        </div>
      )}
    </div>
  );
}