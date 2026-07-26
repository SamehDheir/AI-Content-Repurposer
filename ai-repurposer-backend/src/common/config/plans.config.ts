export const PLAN_LIMITS: Record<string, number> = {
  FREE: 1,
  PRO: Infinity,
};

/**
 * UTC, to match `nextMonthStart`. These used to disagree — the key was built
 * from local time and the TTL from UTC — so for anyone east or west of UTC
 * there was a window of up to a day where the key rolled over to a new month
 * while the old key's expiry had not, or vice versa. On a FREE plan that is the
 * difference between a free extra job and a month locked out early.
 */
export function usageKey(userId: string): string {
  const now = new Date();
  return `usage:${userId}:${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function nextMonthStart(): Date {
  const now = new Date();
  // Fix: Use UTC dates to avoid timezone issues with local Date construction
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  return new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));
}
