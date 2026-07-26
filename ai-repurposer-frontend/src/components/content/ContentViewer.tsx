"use client";
import { useCallback, useEffect, useState } from "react";
import { type Job, type JobSummary, type ContentType, api } from "@/lib/api";
import { dialectName } from "@/lib/dialects";
import { TABS } from "./types";
import { TwitterContent } from "./TwitterContent";
import { BlogContent } from "./BlogContent";
import { FacebookContent } from "./FacebookContent";
import { HighlightsContent } from "./HighlightsContent";

interface Props {
  job: JobSummary;
  onClose: () => void;
  onJobUpdate?: (job: JobSummary) => void;
}

/**
 * The layout sheet. Index tabs run down the left margin the way they would on a
 * folder of proofs; the sheet itself is plain paper so the generated copy is
 * the only thing with any colour on it.
 *
 * The ledger row it opens from carries no prose — only which formats exist — so
 * the sheet fetches its own bodies. That keeps the dashboard's list response
 * small no matter how many takes are in it, at the cost of one request here.
 */
export function ContentViewer({ job, onClose, onJobUpdate }: Props) {
  const [tab, setTab] = useState<ContentType>("TWITTER_THREAD");
  const [copied, setCopied] = useState(false);
  const [edited, setEdited] = useState<Partial<Record<ContentType, string>>>({});
  const [plating, setPlating] = useState(false);
  const [plateError, setPlateError] = useState("");
  const [zoomed, setZoomed] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(job.imageUrl ?? null);
  const [plateLoaded, setPlateLoaded] = useState(false);
  const [full, setFull] = useState<Job | null>(null);
  const [fetchError, setFetchError] = useState("");

  // No state reset on the way in: the sheet is keyed by job id at the call site,
  // so a different job is a different component instance with fresh state.
  useEffect(() => {
    let stale = false;

    api
      .getJob(job.id)
      .then((fetched) => {
        if (stale) return;
        setFull(fetched);
        if (fetched.imageUrl) setImageUrl(fetched.imageUrl);
      })
      .catch((err: unknown) => {
        if (stale) return;
        setFetchError(
          err instanceof Error ? err.message : "Could not load this sheet.",
        );
      });

    return () => {
      stale = true;
    };
  }, [job.id]);

  // Which tabs are selectable is known from the row itself, so the margin is
  // right on the first paint; only the sheet waits on the bodies.
  const formats = new Set(job.generatedContent.map((c) => c.type));
  const loading = !full && !fetchError;

  const bodyOf = (t: ContentType) =>
    edited[t] ?? full?.generatedContent.find((c) => c.type === t)?.body ?? "";

  const body = bodyOf(tab);
  const active = TABS.find((t) => t.key === tab)!;

  // Arabic is the default output language, so the sheet — not the chrome around
  // it — has to run right-to-left. Mirroring the sheet also flips the numbering
  // columns and rules to the correct side, which `text-align` alone would not.
  const arabic = job.language === "Arabic";
  const dir = arabic ? "rtl" : "ltr";
  const lang = arabic ? "ar" : "en";

  // Escape closes, and the page behind must not scroll while the sheet is up.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const copy = async () => {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const editBlog = useCallback((val: string) => {
    setEdited((prev) => ({ ...prev, BLOG_POST: val }));
  }, []);

  const makePlate = async () => {
    setPlating(true);
    setPlateError("");
    try {
      const { imageUrl: url } = await api.generateImageForJob(job.id);
      setPlateLoaded(false);
      setImageUrl(url);
      onJobUpdate?.({ ...job, imageUrl: url });
    } catch (err) {
      setPlateError(err instanceof Error ? err.message : "Could not render the plate.");
    } finally {
      setPlating(false);
    }
  };

  const download = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `plate-${job.id.slice(0, 8)}.png`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(href);
      a.remove();
    } catch {
      setPlateError("Could not download the plate.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-0 backdrop-blur-sm sm:p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Generated pieces"
    >
      <div
        className="flex h-full w-full max-w-5xl flex-col border-rule-strong bg-paper sm:h-auto sm:max-h-[92vh] sm:flex-row sm:border"
        style={{ animation: "cr-rise 0.45s cubic-bezier(.16,.84,.28,1) both" }}
      >
        {/* ── Index tabs, down the margin ── */}
        <nav
          className="hidden w-12 shrink-0 flex-col border-r border-rule sm:flex"
          aria-label="Formats"
        >
          {TABS.map((t) => {
            const has = formats.has(t.key);
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                disabled={!has}
                aria-pressed={on}
                className={`group relative flex flex-1 flex-col items-center justify-center gap-3 border-b border-rule transition-colors last:border-b-0 ${
                  on ? "text-paper" : has ? "text-ink-3 hover:text-ink" : "cursor-not-allowed text-ink-3 opacity-70"
                }`}
                style={{ background: on ? t.ink : undefined }}
              >
                <span className="label">{t.plate}</span>
                <span
                  className="label whitespace-nowrap"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                >
                  {t.label}
                </span>
                {!has && <span className="label absolute bottom-3">—</span>}
              </button>
            );
          })}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* ── Head ── */}
          <header className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
            <div className="min-w-0">
              <span className="label flex items-center gap-2 text-ink-3">
                <span className="h-1.5 w-1.5" style={{ background: active.ink }} />
                Sheet {job.id.slice(0, 8).toUpperCase()} · {job.language}
                {dialectName(job.country) ? ` (${dialectName(job.country)})` : ""}
              </span>
              <p className="slug mt-2 truncate text-[13px] text-ink-2">
                {job.videoUrl.replace(/^https?:\/\/(www\.)?/, "")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="label flex h-8 shrink-0 items-center gap-2 border border-rule px-3 text-ink-3 transition-colors hover:border-signal hover:text-signal"
              aria-label="Close"
            >
              Close ✕
            </button>
          </header>

          {/* ── Mobile tabs ── */}
          <div className="flex border-b border-rule sm:hidden">
            {TABS.map((t) => {
              const has = formats.has(t.key);
              const on = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  disabled={!has}
                  className={`label flex-1 border-r border-rule py-3 last:border-r-0 ${
                    on ? "text-paper" : has ? "text-ink-3" : "cursor-not-allowed text-ink-3 opacity-70"
                  }`}
                  style={{ background: on ? t.ink : undefined }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* ── Plate ── */}
          {imageUrl && (
            <div className="flex items-start gap-4 border-b border-rule bg-surface px-5 py-4">
              <button
                onClick={() => setZoomed((v) => !v)}
                className={`shrink-0 overflow-hidden border border-rule transition-all duration-300 ${
                  zoomed ? "h-48 w-full sm:w-80" : "h-16 w-28"
                }`}
                aria-label={zoomed ? "Shrink the plate" : "Enlarge the plate"}
              >
                {/* The URL comes back before the image exists — pollinations
                    renders on first request, which can take 5–15s. Without its
                    own load state this is just an empty box for that whole
                    time, and the API spinner has already stopped. */}
                <span className="relative block h-full w-full">
                  {!plateLoaded && (
                    <span className="hatch absolute inset-0 flex items-center justify-center bg-surface-2">
                      <span
                        className="h-3 w-3 border border-signal"
                        style={{ animation: "cr-spin 0.9s linear infinite" }}
                      />
                    </span>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Generated featured image"
                    onLoad={() => setPlateLoaded(true)}
                    onError={() => {
                      setPlateLoaded(true);
                      setPlateError("The plate did not render. Try generating it again.");
                    }}
                    className={`h-full w-full object-cover transition-opacity duration-500 ${
                      plateLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </span>
              </button>
              <div className="min-w-0">
                <span className="label text-ink-3">
                  Plate 01 · {plateLoaded ? "featured image" : "rendering…"}
                </span>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={download}
                    className="label border border-rule px-3 py-1.5 text-ink-2 transition-colors hover:border-signal hover:text-signal"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => setZoomed((v) => !v)}
                    className="label border border-rule px-3 py-1.5 text-ink-2 transition-colors hover:border-signal hover:text-signal"
                  >
                    {zoomed ? "Shrink" : "Enlarge"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Sheet ── */}
          <div
            dir={dir}
            lang={lang}
            className="sheet min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8"
          >
            {loading ? (
              <div className="space-y-3 py-4" aria-label="Setting the sheet" aria-busy="true">
                {[100, 96, 88, 98, 72, 94, 84].map((w, i) => (
                  <span
                    key={i}
                    className="block h-3 animate-pulse bg-rule"
                    style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }}
                  />
                ))}
              </div>
            ) : fetchError ? (
              <p className="label py-16 text-center text-signal">{fetchError}</p>
            ) : !body ? (
              <p className="label py-16 text-center text-ink-3">Nothing was cut for this format.</p>
            ) : (
              <>
                {tab === "TWITTER_THREAD" && <TwitterContent body={body} />}
                {tab === "BLOG_POST" && <BlogContent body={body} onBodyChange={editBlog} />}
                {tab === "FACEBOOK_POST" && <FacebookContent body={body} />}
                {tab === "HIGHLIGHTS" && <HighlightsContent body={body} />}
              </>
            )}
          </div>

          {/* ── Foot ── */}
          <footer className="flex flex-col gap-3 border-t border-rule px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="label text-ink-3">
              {loading ? "Setting…" : `${body.length.toLocaleString()} characters set`}
            </span>
            <div className="flex gap-2">
              {!imageUrl && (
                <button
                  onClick={makePlate}
                  disabled={plating}
                  className="label flex h-10 items-center gap-2 border border-rule-strong px-4 text-ink transition-colors hover:border-signal hover:text-signal disabled:text-ink-3"
                >
                  {plating ? (
                    <>
                      <span
                        className="h-2.5 w-2.5 border border-current"
                        style={{ animation: "cr-spin 0.9s linear infinite" }}
                      />
                      Rendering
                    </>
                  ) : (
                    "Make a plate"
                  )}
                </button>
              )}
              <button
                onClick={copy}
                disabled={!body}
                className="label group flex h-10 items-center gap-2 bg-signal px-5 text-signal-ink transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--rule-strong)] disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
              >
                {copied ? "Copied ✓" : "Copy all"}
              </button>
            </div>
          </footer>

          {plateError && (
            <p className="border-t border-signal bg-signal-wash px-5 py-2.5 text-[13px] text-ink">
              {plateError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
