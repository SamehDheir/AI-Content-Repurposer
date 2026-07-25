"use client";
import { useRef, useState } from "react";

interface Props {
  body: string;
  onBodyChange?: (val: string) => void;
}

function render(text: string) {
  let firstParagraph = true;

  return text.split(/\n\n+/).map((para, idx) => {
    if (para.startsWith("# "))
      return (
        <h1 key={idx} className="display mb-4 mt-8 text-3xl leading-tight first:mt-0">
          {para.replace(/^# /, "")}
        </h1>
      );

    if (para.startsWith("## "))
      return (
        <h2 key={idx} className="display mb-3 mt-7 text-2xl leading-snug">
          {para.replace(/^## /, "")}
        </h2>
      );

    if (para.startsWith("### "))
      return (
        <h3 key={idx} className="label mb-2 mt-6 text-ink-3">
          {para.replace(/^### /, "")}
        </h3>
      );

    if (para.match(/^[-•*]\s/m))
      return (
        <ul key={idx} className="my-4 space-y-2">
          {para
            .split("\n")
            .filter(Boolean)
            .map((line, i) => (
              <li key={i} className="flex gap-3 text-[14.5px] leading-[1.75] text-ink-2">
                <span className="mt-[0.6em] h-px w-3 shrink-0 bg-fmt-blog" />
                <span>{line.replace(/^[-•*]\s*/, "")}</span>
              </li>
            ))}
        </ul>
      );

    if (para.match(/^\d+\.\s/m))
      return (
        <ol key={idx} className="my-4 space-y-2">
          {para
            .split("\n")
            .filter(Boolean)
            .map((line, i) => (
              <li key={i} className="flex gap-3 text-[14.5px] leading-[1.75] text-ink-2">
                <span className="label mt-1.5 w-4 shrink-0 text-fmt-blog">{i + 1}</span>
                <span>{line.replace(/^\d+\.\s*/, "")}</span>
              </li>
            ))}
        </ol>
      );

    const dropCap = firstParagraph && para.length > 90;
    firstParagraph = false;

    return (
      <p key={idx} className="mb-4 text-[14.5px] leading-[1.85] text-ink-2">
        {dropCap ? (
          <>
            <span className="display float-left mr-2.5 mt-1.5 text-[3.2rem] leading-[0.72] text-fmt-blog">
              {para.charAt(0)}
            </span>
            {para.slice(1)}
          </>
        ) : (
          para
        )}
      </p>
    );
  });
}

export function BlogContent({ body, onBodyChange }: Props) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  if (editing) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="label text-signal">Marking up the proof</span>
          <button
            onClick={() => setEditing(false)}
            className="label border border-rule px-3 py-1.5 text-ink-2 transition-colors hover:border-signal hover:text-signal"
          >
            Done
          </button>
        </div>
        <textarea
          ref={ref}
          defaultValue={body}
          onChange={(e) => onBodyChange?.(e.target.value)}
          className="slug min-h-[420px] w-full resize-none border border-rule bg-surface p-4 text-[13px] leading-[1.8] text-ink outline-none transition-colors focus:border-signal"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className="group relative cursor-text" onClick={() => setEditing(true)}>
      <span className="label absolute -top-1 right-0 bg-paper px-2 py-1 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100">
        Click to mark up
      </span>
      {render(body)}
    </div>
  );
}
