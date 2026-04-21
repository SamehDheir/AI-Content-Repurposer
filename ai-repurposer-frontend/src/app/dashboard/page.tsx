'use client';
import { useState } from 'react';
import { useJobs } from '@/src/hooks/useJobs';
import { api, type Job } from '@/src/lib/api';
import { JobCard } from '@/src/components/JobCard';
import { ContentViewer } from '@/src/components/ContentViewer';

export default function DashboardPage() {
  const { jobs, loading, error, refetch, updateJob } = useJobs();
  const [url, setUrl]           = useState('');
  const [lang, setLang]         = useState<'Arabic' | 'English'>('Arabic');
  const [submitting, setSubmit] = useState(false);
  const [selected, setSelected] = useState<Job | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSubmit(true);
    try {
      await api.createJob(url.trim(), lang);
      setUrl('');
      await refetch();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmit(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">AI Repurposer</h1>
        <button
          onClick={() => { localStorage.clear(); location.href = '/login'; }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* New job */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">New video</h2>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as 'Arabic' | 'English')}
              className="px-3 py-2 rounded-lg border text-sm focus:outline-none"
            >
              <option value="Arabic">عربي</option>
              <option value="English">English</option>
            </select>
            <button
              type="submit"
              disabled={submitting || !url.trim()}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? '...' : 'Generate'}
            </button>
          </form>
        </div>

        {/* Jobs */}
        <div className="space-y-2">
          {loading && <p className="text-sm text-gray-400">Loading...</p>}
          {error   && <p className="text-sm text-red-500">{error}</p>}
          {!loading && jobs.length === 0 && (
            <p className="text-sm text-gray-400">No jobs yet.</p>
          )}
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onUpdate={(updated) => {
                updateJob(updated);
                // لو اكتمل، افتح المحتوى تلقائياً
                if (updated.status === 'COMPLETED') setSelected(updated);
              }}
              onView={setSelected}
            />
          ))}
        </div>
      </main>

      {selected && (
        <ContentViewer job={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}