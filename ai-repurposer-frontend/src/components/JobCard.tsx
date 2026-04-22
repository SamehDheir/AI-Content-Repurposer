"use client";
import { type Job, type JobStatus } from "@/src/lib/api";
import { useJobSSE } from "@/src/hooks/useJobSSE";
import { ExternalLink, Loader2, CheckCircle2, XCircle, Clock, Image as ImageIcon } from "lucide-react";

const STATUS_CONFIG: Record<JobStatus, {
  label: string;
  icon:  React.ReactNode;
  cls:   string;
  dot:   string;
}> = {
  QUEUED: {
    label: "Queued",
    icon:  <Clock size={11} />,
    cls:   "text-zinc-400 bg-zinc-800 border-zinc-700",
    dot:   "bg-zinc-500",
  },
  PROCESSING: {
    label: "Processing",
    icon:  <Loader2 size={11} className="animate-spin" />,
    cls:   "text-sky-400 bg-sky-500/10 border-sky-500/30",
    dot:   "bg-sky-400 animate-pulse",
  },
  COMPLETED: {
    label: "Completed",
    icon:  <CheckCircle2 size={11} />,
    cls:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    dot:   "bg-emerald-400",
  },
  FAILED: {
    label: "Failed",
    icon:  <XCircle size={11} />,
    cls:   "text-red-400 bg-red-500/10 border-red-500/30",
    dot:   "bg-red-400",
  },
};

interface Props {
  job:      Job;
  onUpdate: (job: Job) => void;
  onView:   (job: Job) => void;
}

export function JobCard({ job, onUpdate, onView }: Props) {
  const isActive = job.status === "QUEUED" || job.status === "PROCESSING";
  useJobSSE(isActive ? job.id : null, onUpdate);

  const { label, icon, cls, dot } = STATUS_CONFIG[job.status];

  // extract video ID for thumbnail
  const videoId = job.videoUrl.match(/[?&]v=([^&]+)/)?.[1];
  const thumb   = videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : null;

  return (
    <div className="group relative flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-white/8 hover:border-white/15 hover:bg-zinc-800/80 transition-all duration-200">

      {/* Thumbnail */}
      {thumb ? (
        <div className="shrink-0 w-16 h-11 rounded-lg overflow-hidden bg-zinc-800">
          <img src={thumb} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
        <div className="shrink-0 w-16 h-11 rounded-lg bg-zinc-800 flex items-center justify-center">
          <ExternalLink size={14} className="text-zinc-600" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-zinc-200 truncate font-medium">{job.videoUrl}</p>
          {job.imageUrl && (
            <ImageIcon size={12} className="text-indigo-400 shrink-0" />
          )}
        </div>
        <p className="text-xs text-zinc-600 mt-0.5">
          {new Date(job.createdAt).toLocaleString()} · {job.language}
        </p>
      </div>

      {/* Status badge */}
      <span className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}>
        {icon}
        {label}
      </span>

      {/* View button */}
      {job.status === "COMPLETED" && (
        <button
          onClick={() => onView(job)}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
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