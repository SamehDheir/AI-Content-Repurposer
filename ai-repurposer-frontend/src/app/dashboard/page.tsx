"use client";
import { useState, lazy, Suspense } from "react";
import { useJobs } from "@/features/jobs/useJobs";
import { api, type JobSummary } from "@/lib/api";
import { DeskRail, DeskHeader } from "@/components/dashboard/DeskChrome";
import { Slate } from "@/components/dashboard/Slate";
import { Waveform } from "@/components/ui/Waveform";

// Heavy pieces stay off the first paint — see CLAUDE.md.
const JobCard = lazy(() =>
  import("@/features/jobs/JobCard").then((m) => ({ default: m.JobCard })),
);
const ContentViewer = lazy(() =>
  import("@/components/content").then((m) => ({ default: m.ContentViewer })),
);
const UsageBanner = lazy(() =>
  import("@/components/ui/UsageBanner").then((m) => ({ default: m.UsageBanner })),
);

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-rule py-3.5 pl-5">
      <span className="h-3 w-6 animate-pulse bg-rule" />
      <span className="h-9 w-16 animate-pulse bg-rule" />
      <span className="h-3 flex-1 animate-pulse bg-rule" />
      <span className="h-3 w-20 animate-pulse bg-rule" />
    </div>
  );
}

export default function DashboardPage() {
  const { jobs, loading, error, refetch, updateJob } = useJobs();
  const [selected, setSelected] = useState<JobSummary | null>(null);

  const signOut = async () => {
    // The cookies are HttpOnly, so only the server can clear them.
    await api.logout().catch(() => {});
    location.href = "/login";
  };

  const cut = jobs.filter((j) => j.status === "COMPLETED").length;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <DeskRail onSignOut={signOut} />

      <div className="pt-14 md:pl-16 md:pt-0">
        <DeskHeader>
          <Suspense
            fallback={<span className="label inline-block h-4 w-40 bg-rule" aria-hidden="true" />}
          >
            <UsageBanner />
          </Suspense>
        </DeskHeader>

        <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
          <Slate take={jobs.length + 1} onSent={refetch} />

          <section className="mt-12" aria-labelledby="ledger-heading">
            <div className="flex items-baseline justify-between border-b border-rule-strong pb-3">
              <h2 id="ledger-heading" className="display text-2xl">
                Ledger
              </h2>
              <span className="label text-ink-3">
                {jobs.length} {jobs.length === 1 ? "take" : "takes"} · {cut} cut
              </span>
            </div>

            {loading && (
              <div>
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </div>
            )}

            {error && (
              <p className="flex items-start gap-2.5 border-b border-signal bg-signal-wash px-5 py-4 text-[13px] text-ink">
                <span className="label mt-0.5 shrink-0 text-signal">Err</span>
                {error}
              </p>
            )}

            {!loading && !error && jobs.length === 0 && (
              <div className="flex flex-col items-center gap-5 border-b border-rule px-6 py-16 text-center">
                <Waveform bars={48} className="h-8 w-48 opacity-30" />
                <div>
                  <p className="label text-ink-2">No footage loaded</p>
                  <p className="mt-3 max-w-xs text-[13.5px] leading-[1.7] text-ink-3">
                    Paste a YouTube link on the slate above. The first take is on the house.
                  </p>
                </div>
                <span className="label text-signal">↑ start here</span>
              </div>
            )}

            {jobs.map((job, i) => (
              <Suspense key={job.id} fallback={<RowSkeleton />}>
                <JobCard
                  job={job}
                  index={jobs.length - i}
                  onUpdate={(updated) => {
                    updateJob(updated);
                    if (updated.status === "COMPLETED") setSelected(updated);
                  }}
                  onView={setSelected}
                />
              </Suspense>
            ))}
          </section>
        </main>
      </div>

      {selected && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim backdrop-blur-sm">
              <span
                className="h-5 w-5 border border-signal"
                style={{ animation: "cr-spin 0.9s linear infinite" }}
              />
            </div>
          }
        >
          {/* Keyed so opening a different take starts a clean sheet — it
              fetches its own content, and stale bodies must not show through. */}
          <ContentViewer
            key={selected.id}
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
