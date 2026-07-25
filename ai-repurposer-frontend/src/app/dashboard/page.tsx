"use client";
import { useState, lazy, Suspense } from "react";
import { useJobs }  from "@/features/jobs/useJobs";
import { api, type Job } from "@/lib/api";
import { Sparkles, LogOut, Plus, AlertCircle, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

// Lazy load heavy components
const JobCard = lazy(() => import("@/features/jobs/JobCard").then(m => ({ default: m.JobCard })));
const ContentViewer = lazy(() => import("@/components/content").then(m => ({ default: m.ContentViewer })));
const UsageBanner = lazy(() => import("@/components/ui/UsageBanner").then(m => ({ default: m.UsageBanner })));

export default function DashboardPage() {
  const { jobs, loading, error, refetch, updateJob } = useJobs();
  const { theme, toggleTheme } = useTheme();
  const [url, setUrl]           = useState("");
  const [lang, setLang]         = useState<"Arabic" | "English">("Arabic");
  const [submitting, setSubmit] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [selected, setSelected] = useState<Job | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSubmit(true);
    setSubmitError("");
    try {
      await api.createJob(url.trim(), lang);
      setUrl("");
      await refetch();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmit(false);
    }
  };

  return (
    <div className={"min-h-screen transition-colors duration-200 bg-gray-50 text-gray-900 dark:bg-[#0e0e10] dark:text-zinc-100"}>

      {/* Ambient top glow */}
      <div className="fixed inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent pointer-events-none z-10" />
      <div className="fixed inset-x-0 top-0 h-32 bg-gradient-to-b from-indigo-950/20 to-transparent pointer-events-none z-0" />

      {/* ── Header ── */}
      <header className={"sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 py-4 border-b backdrop-blur-xl border-gray-200 bg-white/80 dark:border-white/8 dark:bg-[#0e0e10]/80"}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className={"text-sm font-bold tracking-tight text-gray-900 dark:text-zinc-100"}>AI Repurposer</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={"flex items-center justify-center w-8 h-8 rounded-lg transition-all text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-white/10"}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={async () => {
              // Cookies are HttpOnly, so only the server can clear them.
              await api.logout().catch(() => {});
              location.href = "/login";
            }}
            className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-white/8"}
            aria-label="Sign out"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">

        {/* Usage */}
        <Suspense fallback={<div className={"h-12 rounded-xl border bg-gray-100 border-gray-200 dark:bg-zinc-900 dark:border-white/8 animate-pulse"} />}>
          <UsageBanner />
        </Suspense>

        {/* ── Submit form ── */}
        <div className={"rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-zinc-900 p-4 md:p-5"}>
          <div className="flex items-center gap-2 mb-4">
            <Plus size={14} className="text-indigo-400" />
            <h2 className={"text-sm font-semibold text-gray-700 dark:text-zinc-300"}>New video</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={url}
                onChange={(e) => { setUrl(e.target.value); setSubmitError(""); }}
                placeholder="https://youtube.com"
                className={"flex-1 px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:border-indigo-500/60 bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white dark:bg-zinc-800 dark:border-white/10 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-800"}
                aria-label="Video URL input"
              />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as "Arabic" | "English")}
                className={"px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:border-indigo-500/60 cursor-pointer bg-gray-100 border-gray-300 text-gray-900 dark:bg-zinc-800 dark:border-white/10 dark:text-zinc-300"}
                aria-label="Select language"
              >
                <option value="Arabic">Arabic</option>
                <option value="English">English</option>
              </select>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle size={13} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{submitError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !url.trim()}
              className="w-full py-2.5 md:py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2 min-h-[44px]"
              aria-label="Generate content"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Generate content
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Jobs list ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 mb-3">
            <h2 className={"text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-zinc-500"}>
              Your jobs
            </h2>
            {jobs.length > 0 && (
              <span className={"text-xs tabular-nums text-gray-600 dark:text-zinc-600"}>{jobs.length} total</span>
            )}
          </div>

          {loading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className={"h-16 rounded-xl border animate-pulse bg-gray-100 border-gray-200 dark:bg-zinc-900 dark:border-white/8"} />
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle size={14} className="text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && jobs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className={"w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 bg-gray-100 border-gray-200 dark:bg-zinc-800 dark:border-white/10"}>
                <Sparkles size={20} className="text-gray-400 dark:text-zinc-600" />
              </div>
              <p className={"text-sm text-gray-500 dark:text-zinc-500"}>No jobs yet</p>
              <p className={"text-xs mt-1 text-gray-400 dark:text-zinc-700"}>Submit a video URL from YouTube to get started</p>
            </div>
          )}

          {jobs.map((job) => (
            <Suspense key={job.id} fallback={<div className={"h-16 rounded-xl border animate-pulse bg-gray-100 border-gray-200 dark:bg-zinc-900 dark:border-white/8"} />}>
              <JobCard
                job={job}
                onUpdate={(updated) => {
                  updateJob(updated);
                  if (updated.status === "COMPLETED") setSelected(updated);
                }}
                onView={setSelected}
              />
            </Suspense>
          ))}
        </div>
      </main>

      {selected && (
        <Suspense fallback={<div className={"fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-[#0e0e10]/90 backdrop-blur-sm"}>
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        </div>}>
          <ContentViewer 
            job={selected} 
            onClose={() => setSelected(null)} 
            onJobUpdate={(updated) => {
              setSelected(updated);
              updateJob(updated);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}