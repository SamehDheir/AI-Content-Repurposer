'use client';
import { useEffect } from 'react';
import { type Job } from '@/src/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export function useJobSSE(
  jobId: string | null,
  onUpdate: (job: Job) => void,
) {
  useEffect(() => {
    if (!jobId) return;

    const token = localStorage.getItem('accessToken');
    const es = new EventSource(
      `${BASE}/jobs/${jobId}/status?token=${token}`,
    );

    es.onmessage = (e) => {
      const job: Job = JSON.parse(e.data);
      onUpdate(job);
      if (job.status === 'COMPLETED' || job.status === 'FAILED') {
        es.close();
      }
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [jobId, onUpdate]);
}