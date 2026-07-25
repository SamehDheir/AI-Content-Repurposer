"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { youtubeId } from "@/lib/youtube";
import { PENDING_URL_KEY } from "@/components/home/PasteField";

const LANGUAGES = ["Arabic", "English"] as const;
type Language = (typeof LANGUAGES)[number];

/**
 * The composer, built as a clapperboard: the metadata strip is real (today's
 * date, which take this is), the stick claps when a job is sent, and the whole
 * thing reads as the moment before a take rather than as a form.
 */
export function Slate({ take, onSent }: { take: number; onSent: () => void }) {
  const [url, setUrl] = useState("");
  const [lang, setLang] = useState<Language>("Arabic");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [clapping, setClapping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // A URL pasted on the front page waits here until the desk is open. Reading
  // it is a one-shot sync from an external store, which cannot happen during
  // render because sessionStorage does not exist on the server.
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem(PENDING_URL_KEY);
      if (pending) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUrl(pending);
        sessionStorage.removeItem(PENDING_URL_KEY);
        inputRef.current?.focus();
      }
    } catch {
      // No session storage available — nothing to restore.
    }
  }, []);

  const videoId = youtubeId(url.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = url.trim();
    if (!value || sending) return;

    setSending(true);
    setError("");
    setClapping(true);
    setTimeout(() => setClapping(false), 700);

    try {
      await api.createJob(value, lang);
      setUrl("");
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not queue that video.");
    } finally {
      setSending(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={submit} className="border border-rule-strong bg-surface">
      {/* The stick */}
      <div className="overflow-hidden">
        <div
          className="h-6 origin-left"
          style={{
            backgroundImage:
              "repeating-linear-gradient(66deg, var(--ink) 0 15px, var(--paper) 15px 30px)",
            animation: clapping ? "cr-clap 0.55s cubic-bezier(.3,1.4,.5,1)" : undefined,
          }}
          aria-hidden="true"
        />
      </div>

      {/* Production strip */}
      <dl className="grid grid-cols-2 border-b border-rule sm:grid-cols-4">
        {[
          ["Prod.", "AI Repurposer"],
          ["Date", today],
          ["Take", String(take).padStart(3, "0")],
          ["Roll", lang === "Arabic" ? "AR" : "EN"],
        ].map(([k, v], i) => (
          <div
            key={k}
            className={`border-rule px-4 py-2.5 ${i % 2 === 1 ? "border-l" : ""} ${
              i >= 2 ? "border-t sm:border-t-0" : ""
            } ${i > 0 ? "sm:border-l" : ""}`}
          >
            <dt className="label text-ink-3">{k}</dt>
            <dd className="slug mt-1 text-[12.5px] text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      {/* Source */}
      <div className="border-b border-rule p-4 sm:p-5">
        <label htmlFor="slate-url" className="label mb-3 flex items-center gap-2 text-ink-3">
          <span className="h-1.5 w-1.5 bg-signal" />
          Source
        </label>
        <div className="flex items-center gap-4">
          <input
            id="slate-url"
            ref={inputRef}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            placeholder="https://www.youtube.com/watch?v="
            spellCheck={false}
            className="slug h-11 min-w-0 flex-1 border-b border-rule bg-transparent text-[14px] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-signal"
          />
          <div
            className={`hidden h-11 w-20 shrink-0 overflow-hidden border border-rule transition-all duration-300 sm:block ${
              videoId ? "opacity-100" : "opacity-30"
            }`}
          >
            {videoId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="hatch block h-full w-full" />
            )}
          </div>
        </div>
      </div>

      {/* Language + action */}
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div>
          <span className="label mb-3 block text-ink-3">Language</span>
          <div className="relative inline-flex border border-rule">
            <span
              className="absolute inset-y-0 w-1/2 bg-ink transition-transform duration-300 ease-out"
              style={{ transform: `translateX(${lang === "Arabic" ? "0%" : "100%"})` }}
              aria-hidden="true"
            />
            {LANGUAGES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`label relative z-10 h-10 w-24 transition-colors ${
                  lang === l ? "text-paper" : "text-ink-3 hover:text-ink"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={sending || !url.trim()}
          className="label group flex h-12 items-center justify-center gap-2.5 bg-signal px-8 text-signal-ink transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--rule-strong)] disabled:pointer-events-none disabled:bg-rule-strong disabled:text-ink-3"
        >
          {sending ? (
            <>
              <span
                className="h-3 w-3 border border-current"
                style={{ animation: "cr-spin 0.9s linear infinite" }}
              />
              Rolling
            </>
          ) : (
            <>
              Roll it
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="flex items-start gap-2.5 border-t border-signal bg-signal-wash px-5 py-3 text-[13px] text-ink">
          <span className="label mt-0.5 shrink-0 text-signal">Err</span>
          {error}
        </p>
      )}
    </form>
  );
}
