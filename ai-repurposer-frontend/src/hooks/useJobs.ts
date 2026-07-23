'use client';
import { useState, useEffect, useCallback } from 'react';
import { api, type Job } from '@/src/lib/api';

export function useJobs() {
  const [jobs, setJobs]       = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await api.getMyJobs();
      setJobs(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const updateJob = useCallback((updated: Job) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === updated.id ? updated : j)),
    );
  }, []);

  return { jobs, loading, error, refetch: fetchJobs, updateJob };
}