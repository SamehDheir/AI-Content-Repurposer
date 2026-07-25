'use client';
import { useEffect, useRef } from 'react';
import { type Job } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function useJobSSE(
  jobId: string | null,
  onUpdate: (job: Job) => void,
) {
  // Callers pass inline arrows, so keep the latest callback in a ref instead of
  // depending on it — otherwise every render tears down and reopens the stream.
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!jobId) return;

    // withCredentials sends the HttpOnly auth cookie; the token is no longer
    // passed in the query string.
    const es = new EventSource(`${BASE}/jobs/${jobId}/status`, {
      withCredentials: true,
    });

    es.onmessage = (e) => {
      const job: Job = JSON.parse(e.data);
      onUpdateRef.current(job);
      if (job.status === 'COMPLETED' || job.status === 'FAILED') {
        es.close();
      }
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [jobId]);
}
