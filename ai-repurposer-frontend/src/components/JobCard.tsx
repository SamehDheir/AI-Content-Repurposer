'use client';
import { type Job, type JobStatus } from '@/src/lib/api';
import { useJobSSE } from '@/src/hooks/useJobSSE';

const STATUS: Record<JobStatus, { label: string; cls: string }> = {
  QUEUED:     { label: 'Queued',        cls: 'bg-gray-100 text-gray-600' },
  PROCESSING: { label: 'Processing...', cls: 'bg-blue-100 text-blue-700' },
  COMPLETED:  { label: 'Completed',     cls: 'bg-green-100 text-green-700' },
  FAILED:     { label: 'Failed',        cls: 'bg-red-100 text-red-600' },
};

interface Props {
  job:      Job;
  onUpdate: (job: Job) => void;
  onView:   (job: Job) => void;
}

export function JobCard({ job, onUpdate, onView }: Props) {
  const isActive = job.status === 'QUEUED' || job.status === 'PROCESSING';

  useJobSSE(isActive ? job.id : null, onUpdate);

  const { label, cls } = STATUS[job.status];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 transition-all">
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1.5 ${cls}`}>
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        )}
        {label}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 truncate">{job.videoUrl}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(job.createdAt).toLocaleString()} · {job.language}
        </p>
      </div>

      {job.status === 'COMPLETED' && (
        <button
          onClick={() => onView(job)}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 transition-colors"
        >
          View
        </button>
      )}
    </div>
  );
}