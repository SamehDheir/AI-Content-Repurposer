export const PLAN_LIMITS: Record<string, number> = {
  FREE: 1,
  PRO: Infinity,
};

export function usageKey(userId: string): string {
  const now = new Date();
  return `usage:${userId}:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function nextMonthStart(): Date {
  const now = new Date();
  // Fix: Use UTC dates to avoid timezone issues with local Date construction
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  return new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));
}
