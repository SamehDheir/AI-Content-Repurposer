'use client';
import { useEffect, useRef } from 'react';
import { api, type JobStatus, type JobSummary } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * How many times a broken stream is allowed to reopen. The access token lives
 * 15 minutes, so three covers a job that outlasts an hour of token rotations
 * without letting a genuinely dead backend be retried forever.
 */
const MAX_REOPENS = 3;

const isTerminal = (s: JobStatus) => s === 'COMPLETED' || s === 'FAILED';

export function useJobSSE(
  jobId: string | null,
  onUpdate: (job: JobSummary) => void,
) {
  // Callers pass inline arrows, so keep the latest callback in a ref instead of
  // depending on it — otherwise every render tears down and reopens the stream.
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!jobId) return;

    let es: EventSource | null = null;
    let unmounted = false;
    let reopens = 0;

    const close = () => {
      es?.close();
      es = null;
    };

    const open = () => {
      if (unmounted) return;

      // withCredentials sends the HttpOnly auth cookie; the token is no longer
      // passed in the query string.
      es = new EventSource(`${BASE}/jobs/${jobId}/status`, {
        withCredentials: true,
      });

      es.onmessage = (e) => {
        const job: JobSummary = JSON.parse(e.data);
        onUpdateRef.current(job);
        if (isTerminal(job.status)) close();
      };

      es.onerror = () => {
        close();
        void reopen();
      };
    };

    /**
     * EventSource cannot route through the refresh-and-replay in api.ts, so an
     * access token expiring mid-job used to kill the stream silently and leave
     * the row reading "Cutting" until the reader reloaded. One ordinary fetch
     * through the client rotates the cookie — and tells us whether the job
     * finished while the stream was down, in which case there is nothing to
     * reopen. A refusal here means signed out or API down, so we stop.
     */
    const reopen = async () => {
      if (unmounted || reopens >= MAX_REOPENS) return;
      reopens += 1;

      try {
        const job = await api.getJob(jobId);
        if (unmounted) return;
        onUpdateRef.current(job);
        if (isTerminal(job.status)) return;
      } catch {
        return;
      }

      open();
    };

    open();

    return () => {
      unmounted = true;
      close();
    };
  }, [jobId]);
}
