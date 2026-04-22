"use client";
import { useState } from "react";
import { useJobs }  from "@/src/hooks/useJobs";
import { api, type Job } from "@/src/lib/api";
import { JobCard }      from "@/src/components/JobCard";
import { ContentViewer } from "@/src/components/content";
import { UsageBanner }  from "@/src/components/UsageBanner";
import { Sparkles, LogOut, Plus, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const { jobs, loading, error, refetch, updateJob } = useJobs();
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
    <div className="min-h-screen bg-[#0e0e10] text-zinc-100">

      {/* Ambient top glow */}
      <div className="fixed inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent pointer-events-none z-10" />
      <div className="fixed inset-x-0 top-0 h-32 bg-gradient-to-b from-indigo-950/20 to-transparent pointer-events-none z-0" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-white/8 bg-[#0e0e10]/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-zinc-100 tracking-tight">AI Repurposer</span>
        </div>
        <button
          onClick={() => { localStorage.clear(); location.href = "/login"; }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/8 transition-all"
        >
          <LogOut size={12} />
          Sign out
        </button>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Usage */}
        <UsageBanner />

        {/* ── Submit form ── */}
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Plus size={14} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-zinc-300">New video</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <input
                value={url}
                onChange={(e) => { setUrl(e.target.value); setSubmitError(""); }}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:bg-zinc-800 transition-all"
              />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as "Arabic" | "English")}
                className="px-3 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/60 transition-all cursor-pointer"
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
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
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
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Your jobs
            </h2>
            {jobs.length > 0 && (
              <span className="text-xs text-zinc-600 tabular-nums">{jobs.length} total</span>
            )}
          </div>

          {loading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-zinc-900 border border-white/8 animate-pulse" />
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
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center mb-3">
                <Sparkles size={20} className="text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500">No jobs yet</p>
              <p className="text-xs text-zinc-700 mt-1">Submit a YouTube URL above to get started</p>
            </div>
          )}

          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onUpdate={(updated) => {
                updateJob(updated);
                if (updated.status === "COMPLETED") setSelected(updated);
              }}
              onView={setSelected}
            />
          ))}
        </div>
      </main>

      {selected && (
        <ContentViewer 
          job={selected} 
          onClose={() => setSelected(null)} 
          onJobUpdate={(updated) => {
            setSelected(updated);
            updateJob(updated);
          }}
        />
      )}
    </div>
  );
}