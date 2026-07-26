/**
 * Fail the boot, not the request.
 *
 * `AuthModule` does `JwtModule.register({ secret: process.env.JWT_SECRET! })`.
 * With the variable unset that non-null assertion is a lie: the module builds
 * happily with `undefined` and the app only falls over later, on the first
 * login, as an opaque 500. The same is true of every other key read with `!`.
 *
 * Planned in ROADMAP phase 4 and never written, because that phase was
 * deliberately behaviour-preserving and this changes startup behaviour.
 */

/** Missing any of these means the app cannot work at all. */
const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'] as const;

/** Missing these degrades one feature, so warn rather than refuse to start. */
const OPTIONAL: Record<string, string> = {
  OPENROUTER_API_KEY: 'content and image generation will fail',
  GROQ_API_KEY:
    'Whisper fallback is unavailable; only videos with captions work',
  GOOGLE_CLIENT_ID: 'Sign in with Google is unavailable',
  GOOGLE_CLIENT_SECRET: 'Sign in with Google is unavailable',
  GOOGLE_CALLBACK_URL: 'Sign in with Google is unavailable',
  FRONTEND_URL: 'verification and reset links will point at localhost',
  SMTP_HOST: 'no email can be sent, so nobody can verify an address',
};

/**
 * Length is a proxy for entropy, and a poor one — 28 random hex characters are
 * far stronger than 40 characters of English. So this refuses to start only on
 * a secret short enough to be indefensible at any entropy, and merely warns in
 * the band where the answer depends on how the value was generated.
 */
const MIN_SECRET_LENGTH = 16;
const RECOMMENDED_SECRET_LENGTH = 32;

/** Env values arrive as `unknown`; anything not a string is treated as unset. */
function read(config: Record<string, unknown>, key: string): string {
  const value = config[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const problems: string[] = [];

  for (const key of REQUIRED) {
    if (!read(config, key)) {
      problems.push(`${key} is required but not set`);
    }
  }

  const weakSecrets: string[] = [];

  for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const) {
    const value = read(config, key);
    if (!value) continue;

    if (value.length < MIN_SECRET_LENGTH) {
      problems.push(
        `${key} is only ${value.length} characters; that is too short at any entropy`,
      );
    } else if (value.length < RECOMMENDED_SECRET_LENGTH) {
      weakSecrets.push(
        `${key} is ${value.length} characters. Fine if it is random, weak if it is a phrase — prefer \`openssl rand -hex 32\``,
      );
    }
  }

  // Sharing one secret between the two token types defeats the point of having
  // two: a stolen 15-minute access token would verify as a 7-day refresh token.
  if (config.JWT_SECRET && config.JWT_SECRET === config.JWT_REFRESH_SECRET) {
    problems.push(
      'JWT_SECRET and JWT_REFRESH_SECRET must differ, or an access token can be replayed as a refresh token',
    );
  }

  if (problems.length) {
    throw new Error(
      `Invalid environment:\n  - ${problems.join('\n  - ')}\n` +
        `See ai-repurposer-backend/.env.example for the full list.`,
    );
  }

  // Plain console throughout: this runs inside ConfigModule during bootstrap,
  // before Nest's logger exists.
  for (const warning of weakSecrets) {
    console.warn(`[env] ${warning}`);
  }

  const missing = Object.keys(OPTIONAL).filter((k) => !config[k]);
  if (missing.length) {
    console.warn(
      `[env] Optional variables not set:\n${missing
        .map((k) => `  - ${k}: ${OPTIONAL[k]}`)
        .join('\n')}`,
    );
  }

  return config;
}
