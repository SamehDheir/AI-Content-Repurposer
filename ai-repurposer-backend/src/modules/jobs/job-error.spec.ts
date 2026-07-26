import { JOB_ERROR_FALLBACK, safeJobError, toUserMessage } from './job-error';

describe('toUserMessage', () => {
  describe('never leaks internals', () => {
    // These are shaped like the real thing: yt-dlp echoes the whole command it
    // ran, which contains the temp path, and Prisma echoes the datasource.
    const leaky = [
      'Command failed: yt-dlp --js-runtimes node -o "C:\\Users\\Sameh Dheir\\AppData\\Local\\Temp\\yt-audio-abc.webm" "https://www.youtube.com/watch?v=abc"',
      'connect ECONNREFUSED 127.0.0.1:5434 postgresql://user:hunter2@localhost:5434/db',
      '401 Incorrect API key provided: sk-or-v1-9f3a2b7c1d4e5f6a7b8c9d0e1f2a3b4c',
      'Error: ENOENT: no such file or directory, open /var/secrets/id_rsa',
    ];

    it.each(leaky)('drops everything from: %s', (raw) => {
      const out = toUserMessage(new Error(raw));
      for (const secret of [
        'yt-dlp --js-runtimes',
        'AppData',
        'sk-or-v1',
        'hunter2',
        'postgresql://',
        'id_rsa',
        '5434',
      ]) {
        expect(out).not.toContain(secret);
      }
    });

    it('falls back rather than echoing an unrecognised message', () => {
      expect(toUserMessage(new Error('some brand new failure mode'))).toBe(
        JOB_ERROR_FALLBACK,
      );
    });

    it('handles a non-Error throw', () => {
      expect(toUserMessage(undefined)).toBe(JOB_ERROR_FALLBACK);
      expect(toUserMessage(null)).toBe(JOB_ERROR_FALLBACK);
      expect(toUserMessage({ weird: true })).toBe(JOB_ERROR_FALLBACK);
    });
  });

  describe('distinguishes the failures a user can act on', () => {
    const distinct = (raw: string) => toUserMessage(new Error(raw));

    it('separates private, unavailable, age-restricted and live', () => {
      const messages = [
        distinct(
          "ERROR: [youtube] abc: Private video. Sign in if you've been granted access",
        ),
        distinct('ERROR: [youtube] abc: Video unavailable'),
        distinct('ERROR: [youtube] abc: Sign in to confirm your age'),
        distinct('ERROR: [youtube] abc: This live event will begin in 3 hours'),
      ];
      expect(new Set(messages).size).toBe(4);
      expect(messages.every((m) => m !== JOB_ERROR_FALLBACK)).toBe(true);
    });

    it('maps the size cap', () => {
      expect(distinct('Audio too large: 31.4MB (max 24MB)')).toMatch(
        /too long/i,
      );
    });

    it('maps being out of credit separately from being rate limited', () => {
      const credit = distinct('402 This request requires more credits');
      const busy = distinct('429 Rate limit exceeded');
      expect(credit).not.toBe(busy);
      expect(credit).toMatch(/credit/i);
      expect(busy).toMatch(/busy/i);
    });

    it('maps a missing yt-dlp to an our-side message', () => {
      expect(distinct('spawn yt-dlp ENOENT')).toMatch(/on our side/i);
    });

    it('maps an empty transcript', () => {
      expect(distinct('Whisper returned empty transcript')).toMatch(
        /not enough clear speech/i,
      );
    });
  });
});

describe('safeJobError', () => {
  it('passes a known message through', () => {
    const known = toUserMessage(new Error('Video unavailable'));
    expect(safeJobError(known)).toBe(known);
  });

  it('replaces anything not from the table, even if a caller hand-writes it', () => {
    expect(safeJobError('yt-dlp exploded at /tmp/secret')).toBe(
      JOB_ERROR_FALLBACK,
    );
  });
});
