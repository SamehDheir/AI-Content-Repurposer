import type { CookieOptions, Request, Response } from 'express';

export const ACCESS_COOKIE = 'accessToken';
export const REFRESH_COOKIE = 'refreshToken';

/**
 * The access token is short-lived because it is replayed on every request;
 * the refresh token carries the actual session length and is rotated on use.
 */
export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL = '7d';

const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * Defaults suit a local, same-site setup (frontend :3001, backend :3000 — ports
 * do not affect SameSite). A cross-domain deployment must set
 * COOKIE_SAMESITE=none, which forces Secure and therefore requires HTTPS, and
 * loses the CSRF protection that Lax provides for free.
 */
function baseOptions(): CookieOptions {
  const sameSite = (process.env.COOKIE_SAMESITE ?? 'lax').toLowerCase() as
    | 'lax'
    | 'strict'
    | 'none';

  const secure =
    sameSite === 'none' || // browsers reject SameSite=None without Secure
    (process.env.COOKIE_SECURE
      ? process.env.COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production');

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined,
  };
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
): void {
  const options = baseOptions();
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...options,
    maxAge: ACCESS_MAX_AGE,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...options,
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies(res: Response): void {
  // clearCookie only matches when the attributes match how it was set.
  const options = baseOptions();
  res.clearCookie(ACCESS_COOKIE, options);
  res.clearCookie(REFRESH_COOKIE, options);
}

/** Reads a JWT out of a cookie for passport-jwt's jwtFromRequest. */
export function cookieExtractor(name: string) {
  return (req: Request): string | null => {
    const cookies = (req as Request & { cookies?: Record<string, string> })
      .cookies;
    return cookies?.[name] ?? null;
  };
}
