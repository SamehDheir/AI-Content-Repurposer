// src/components/UsageBanner.tsx
'use client';
import { useEffect, useState } from 'react';
import { api } from '@/src/lib/api';

interface MeResponse {
  plan: 'FREE' | 'PRO';
  usage: {
    used:      number;
    limit:     number | null;
    remaining: number | null;
    resetsAt:  string;
  };
}

export function UsageBanner() {
  const [data, setData] = useState<MeResponse | null>(null);

  useEffect(() => {
    api.getMe().then(setData).catch(() => {});
  }, []);

  if (!data || data.plan === 'PRO') return null;

  const { used, limit, remaining, resetsAt } = data.usage;
  const isLimit = remaining === 0;

  return (
    <div className={`rounded-xl border p-4 ${
      isLimit
        ? 'border-red-200 bg-red-50'
        : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Free plan — {used} / {limit} video used this month
        </span>
        {!isLimit && (
          <span className="text-xs text-gray-400">
            Resets {new Date(resetsAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isLimit ? 'bg-red-500' : 'bg-indigo-500'}`}
          style={{ width: `${limit ? Math.min((used / limit) * 100, 100) : 0}%` }}
        />
      </div>

      {isLimit && (
        <p className="text-xs text-red-600 font-medium mt-2">
          Limit reached — upgrade to Pro for unlimited videos.
        </p>
      )}
    </div>
  );
}