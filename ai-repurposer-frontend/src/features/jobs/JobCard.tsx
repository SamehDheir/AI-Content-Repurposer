"use client";
import { type Job, type JobStatus } from "@/lib/api";
import { useJobSSE } from "@/features/jobs/useJobSSE";
import { ExternalLink, Loader2, CheckCircle2, XCircle, Clock, Image as ImageIcon } from "lucide-react";

const STATUS_CONFIG: Record<JobStatus, {
  label: string;
  icon:  React.ReactNode;
  dot:   string;
}> = {
  QUEUED: {
    label: "Queued",
    icon:  <Clock size={11} />,
    dot:   "bg-zinc-500",
  },
  PROCESSING: {
    label: "Processing",
    icon:  <Loader2 size={11} className="animate-spin" />,
    dot:   "bg-sky-400 animate-pulse",
  },
  COMPLETED: {
    label: "Completed",
    icon:  <CheckCircle2 size={11} />,
    dot:   "bg-emerald-400",
  },
  FAILED: {
    label: "Failed",
    icon:  <XCircle size={11} />,
    dot:   "bg-red-400",
  },
};

const STATUS_CLS: Record<JobStatus, string> = {
  QUEUED:     "text-gray-600 bg-gray-100 border-gray-300 dark:text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700",
  PROCESSING: "text-sky-600 bg-sky-50 border-sky-300 dark:text-sky-400 dark:bg-sky-500/10 dark:border-sky-500/30",
  COMPLETED:  "text-emerald-600 bg-emerald-50 border-emerald-300 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/30",
  FAILED:     "text-red-600 bg-red-50 border-red-300 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/30",
};

interface Props {
  job:      Job;
  onUpdate: (job: Job) => void;
  onView:   (job: Job) => void;
}

export function JobCard({ job, onUpdate, onView }: Props) {
  const isActive = job.status === "QUEUED" || job.status === "PROCESSING";
  useJobSSE(isActive ? job.id : null, onUpdate);

  const { label, icon, dot } = STATUS_CONFIG[job.status];

  // extract video ID for thumbnail
  const videoId = job.videoUrl.match(/[?&]v=([^&]+)/)?.[1];
  const thumb   = videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : null;

  return (
    <div className={"group relative flex items-center gap-4 p-4 rounded-xl transition-all duration-200 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:bg-zinc-900 dark:border-white/8 dark:hover:border-white/15 dark:hover:bg-zinc-800/80"}>

      {/* Thumbnail */}
      {thumb ? (
        <div className={"shrink-0 w-16 h-11 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800"}>
          <img src={thumb} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
        <div className={"shrink-0 w-16 h-11 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-zinc-800"}>
          <ExternalLink size={14} className="text-gray-400 dark:text-zinc-600" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={"text-sm truncate font-medium text-gray-900 dark:text-zinc-200"}>{job.videoUrl}</p>
          {job.imageUrl && (
            <ImageIcon size={12} className="text-indigo-400 shrink-0" />
          )}
        </div>
        <p className={"text-xs mt-0.5 text-gray-500 dark:text-zinc-600"}>
          {new Date(job.createdAt).toLocaleString()} · {job.language}
        </p>
      </div>

      {/* Status badge */}
      <span className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CLS[job.status]}`}>
        {icon}
        {label}
      </span>

      {/* View button */}
      {job.status === "COMPLETED" && (
        <button
          onClick={() => onView(job)}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
          aria-label={`View content for job ${job.id.slice(0, 8)}`}
        >
          View
        </button>
      )}

      {/* Processing shimmer */}
      {isActive && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-500/5 to-transparent animate-[shimmer_2s_ease-in-out_infinite] -translate-x-full" />
        </div>
      )}
    </div>
  );
}