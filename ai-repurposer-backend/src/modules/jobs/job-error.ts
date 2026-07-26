/**
 * Turns whatever blew up inside the worker into one sentence the person who
 * submitted the video can act on.
 *
 * Before this, a FAILED job carried no reason at all: "video is private", "no
 * captions and yt-dlp is missing", "audio over 24 MB" and "OpenRouter is out of
 * credit" were indistinguishable in the UI, and the difference lived only in
 * the server log.
 *
 * The rule that matters: **this never returns text taken from an exception.**
 * It returns one of the constants below or the fallback. yt-dlp failures embed
 * the full command line and the temp-file path, Prisma errors embed the
 * connection string, and an OpenAI SDK error can carry request context — none
 * of which belongs in a user-visible field that is also served over the API.
 */

export const JOB_ERROR_FALLBACK =
  'Something went wrong while processing this video. Try again — if it keeps failing, the video may not be supported.';

/**
 * First match wins, so the specific patterns come before the broad ones.
 * "not available" in particular would otherwise swallow half the list.
 */
const PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [
    /private video|sign in to confirm you.?re not a bot|members[- ]only|join this channel/i,
    'This video is private or restricted, so it cannot be read.',
  ],
  [
    /age[- ]restricted|confirm your age|inappropriate for some users/i,
    'This video is age-restricted, so it cannot be downloaded for transcription.',
  ],
  [
    /is live|live stream|premieres in/i,
    'Live streams cannot be transcribed. Try again once the recording is published.',
  ],
  [
    /audio too large|max 24\s*mb/i,
    'This video is too long to transcribe. Try one under roughly 40 minutes.',
  ],
  [
    /whisper returned empty|transcript is too short|too short to generate/i,
    'There was not enough clear speech in this video to write anything from it.',
  ],
  [
    /yt-dlp.*(not found|ENOENT)|ENOENT.*yt-dlp|spawn yt-dlp/i,
    'The server is missing a component needed for videos without captions. This is on our side.',
  ],
  [
    /\b402\b|insufficient credit|more credits|out of credit/i,
    'The AI service is out of credit. This is on our side, not yours.',
  ],
  [
    /\b429\b|rate limit|too many requests|currently busy/i,
    'The AI service is busy right now. Try again in a minute.',
  ],
  [
    /timed out|timeout|ETIMEDOUT|ESOCKETTIMEDOUT/i,
    'This video took too long to download. Try a shorter one.',
  ],
  [
    /ENOTFOUND|ECONNREFUSED|ECONNRESET|network|getaddrinfo/i,
    'We could not reach a service needed to process this video. Try again shortly.',
  ],
  [
    /unavailable in your|blocked it in your country|geo restricted/i,
    'This video is not available in the region the server runs in.',
  ],
  // Broad, so last: yt-dlp says this for removed, deleted and some
  // region-locked videos alike.
  [
    /video unavailable|not available|removed by the uploader|does not exist/i,
    "This video isn't available. It may have been removed or made private.",
  ],
  [
    /invalid youtube url|could not extract video id/i,
    'That link could not be read as a YouTube video.',
  ],
  [
    /no captions|transcript panel not found|no transcript/i,
    'This video has no captions and its audio could not be transcribed.',
  ],
];

/** Postgres columns are cheap but the UI has one line to show. */
const MAX_LENGTH = 200;

export function toUserMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? `${error.message}`
      : typeof error === 'string'
        ? error
        : '';

  if (!raw) return JOB_ERROR_FALLBACK;

  for (const [pattern, message] of PATTERNS) {
    if (pattern.test(raw)) return message;
  }

  return JOB_ERROR_FALLBACK;
}

/**
 * Guards the invariant rather than trusting every future call site: whatever a
 * caller passes, what reaches the column is one of ours.
 */
export function safeJobError(message: string): string {
  const known =
    message === JOB_ERROR_FALLBACK ||
    PATTERNS.some(([, candidate]) => candidate === message);

  if (!known) return JOB_ERROR_FALLBACK;
  return message.slice(0, MAX_LENGTH);
}
