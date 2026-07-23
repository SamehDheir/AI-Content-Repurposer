'use client';
import { useEffect, useRef } from 'react';
import { type Job } from '@/src/lib/api';
import { ACCESS_TOKEN, getCookie } from '@/src/lib/cookies';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

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

    const token = getCookie(ACCESS_TOKEN);
    if (!token) return;

    const es = new EventSource(
      `${BASE}/jobs/${jobId}/status?token=${encodeURIComponent(token)}`,
    );

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
