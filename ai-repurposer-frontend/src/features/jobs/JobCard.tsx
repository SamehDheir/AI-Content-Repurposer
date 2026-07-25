"use client";
import { type ContentType, type Job } from "@/lib/api";
import { useJobSSE } from "@/features/jobs/useJobSSE";
import { useScramble } from "@/lib/hooks/useScramble";
import { thumbnailFor } from "@/lib/youtube";

const FORMAT_INK: Record<ContentType, string> = {
  TWITTER_THREAD: "var(--fmt-thread)",
  BLOG_POST: "var(--fmt-blog)",
  FACEBOOK_POST: "var(--fmt-social)",
  HIGHLIGHTS: "var(--fmt-marks)",
};

const FORMAT_ORDER: ContentType[] = [
  "TWITTER_THREAD",
  "BLOG_POST",
  "FACEBOOK_POST",
  "HIGHLIGHTS",
];

function loggedAt(iso: string) {
  const then = new Date(iso);
  const mins = Math.round((Date.now() - then.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  return then.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/** The four (plus one) pieces a finished job carries. */
function Pieces({ job }: { job: Job }) {
  const present = new Set(job.generatedContent.map((c) => c.type));
  return (
    <span className="flex items-center gap-1" title={`${present.size} of 4 formats`}>
      {FORMAT_ORDER.map((type) => (
        <span
          key={type}
          className="h-2.5 w-2.5 border"
          style={{
            borderColor: FORMAT_INK[type],
            background: present.has(type) ? FORMAT_INK[type] : "transparent",
          }}
        />
      ))}
      <span
        className="ml-1 h-2.5 w-2.5 border border-signal"
        style={{ background: job.imageUrl ? "var(--signal)" : "transparent" }}
        title={job.imageUrl ? "plate rendered" : "no plate yet"}
      />
    </span>
  );
}

interface Props {
  job: Job;
  index: number;
  onUpdate: (job: Job) => void;
  onView: (job: Job) => void;
}

export function JobCard({ job, index, onUpdate, onView }: Props) {
  const running = job.status === "QUEUED" || job.status === "PROCESSING";
  useJobSSE(running ? job.id : null, onUpdate);

  const slug = job.id.slice(0, 8).toUpperCase();
  const { frame, run } = useScramble(slug, { speed: 22 });
  const thumb = thumbnailFor(job.videoUrl);
  const done = job.status === "COMPLETED";
  const failed = job.status === "FAILED";

  return (
    <article
      onMouseEnter={run}
      className="group relative flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-rule py-3.5 pl-5 pr-2 transition-colors hover:bg-surface sm:flex-nowrap"
    >
      {/* Left edge marker — grows on hover, permanent on a failed take. */}
      <span
        className={`absolute inset-y-0 left-0 w-[3px] origin-center bg-signal transition-transform duration-300 ${
          failed ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"
        }`}
        aria-hidden="true"
      />

      <span className="label w-6 shrink-0 text-ink-3">{String(index).padStart(2, "0")}</span>

      <span className="h-9 w-16 shrink-0 overflow-hidden border border-rule bg-surface-2">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
          />
        ) : (
          <span className="hatch block h-full w-full" />
        )}
      </span>

      <div className="min-w-0 flex-1 basis-full sm:basis-auto">
        <p className="slug truncate text-[13px] text-ink">
          {job.videoUrl.replace(/^https?:\/\/(www\.)?/, "")}
        </p>
        <p className="label mt-1.5 flex items-center gap-2 text-ink-3">
          <span className="tabular-nums">{frame}</span>
          <span className="h-2 w-px bg-rule" />
          {job.language}
          <span className="h-2 w-px bg-rule" />
          <span suppressHydrationWarning>{loggedAt(job.createdAt)}</span>
        </p>
      </div>

      {/* Status */}
      <div className="ml-auto flex shrink-0 items-center gap-4">
        {running && (
          <span className="flex items-center gap-2.5">
            <span className="relative block h-[3px] w-16 overflow-hidden bg-rule sm:w-24">
              <span
                className="absolute inset-y-0 w-1/3 bg-signal"
                style={{ animation: "cr-playhead 1.6s ease-in-out infinite" }}
              />
            </span>
            <span className="label text-ink-2">
              {job.status === "QUEUED" ? "Queued" : "Cutting"}
            </span>
          </span>
        )}

        {done && <Pieces job={job} />}

        {failed && <span className="label text-signal">Failed</span>}

        {done ? (
          <button
            onClick={() => onView(job)}
            className="label group/btn flex h-8 items-center gap-1.5 border border-rule px-3 text-ink-2 transition-colors hover:border-signal hover:bg-signal hover:text-signal-ink"
            aria-label={`Open the pieces cut from ${job.videoUrl}`}
          >
            Open
            <span className="transition-transform duration-300 group-hover/btn:translate-x-0.5">
              →
            </span>
          </button>
        ) : (
          <span className="hidden h-8 w-[74px] sm:block" aria-hidden="true" />
        )}
      </div>
    </article>
  );
}
