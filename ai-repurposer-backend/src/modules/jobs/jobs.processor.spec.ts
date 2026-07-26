// JobsProcessor imports TranscriptionService for its constructor type, and Nest
// needs the real class at runtime for `design:paramtypes`, so `import type`
// would break DI. That pulls in youtubei.js, which ships ESM only and cannot be
// transformed by ts-jest. A factory mock keeps the real module from ever
// loading — the services are all injected as fakes here anyway.
jest.mock('youtubei.js', () => ({ Innertube: { create: jest.fn() } }));

import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobsProcessor } from './jobs.processor';
import { JOB_ERROR_FALLBACK } from './job-error';

// Half these cases drive the failure path on purpose, and the processor logs
// each one with a stack. Without this the suite output is mostly noise.
beforeAll(() => {
  Logger.overrideLogger(false);
});
afterAll(() => {
  Logger.overrideLogger(console);
});

const VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

type Update = { status?: string; error?: string | null };
type Existing = { id: string; status: string } | null;

// Everything returns an already-resolved promise rather than being `async`:
// these bodies have nothing to await, and the lint rules for unsafe returns and
// await-less async functions both fire otherwise.
function harness(opts: {
  existing?: Existing;
  transcript?: () => Promise<string>;
}) {
  const updates: Update[] = [];
  let cleanups = 0;

  const existing: Existing =
    opts.existing === undefined
      ? { id: 'j1', status: 'QUEUED' }
      : opts.existing;

  const prisma = {
    job: {
      findUnique: jest.fn(() => Promise.resolve(existing)),
      update: jest.fn((args: { data: Update }) => {
        updates.push(args.data);
        return Promise.resolve(args.data);
      }),
    },
    generatedContent: { deleteMany: jest.fn(), createMany: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
  };

  const transcription = {
    getTranscript: jest.fn(
      opts.transcript ??
        (() => Promise.resolve('a transcript long enough to be usable')),
    ),
    cleanupAudioFile: jest.fn(() => {
      cleanups += 1;
      return Promise.resolve();
    }),
  };

  const ai = {
    generateContent: jest.fn(() => Promise.resolve('generated body')),
  };

  const processor = new JobsProcessor(
    prisma as never,
    transcription as never,
    ai as never,
    {} as never,
  );

  const run = (attemptsMade: number, attempts = 3) =>
    processor.process({
      data: { jobId: 'j1', videoUrl: VIDEO_URL },
      attemptsMade,
      opts: { attempts },
    } as unknown as Job<{ jobId: string; videoUrl: string }>);

  return {
    run,
    updates,
    ai,
    transcription,
    prisma,
    get cleanups() {
      return cleanups;
    },
  };
}

describe('JobsProcessor.process', () => {
  describe('idempotency', () => {
    it('skips a job already COMPLETED', async () => {
      const h = harness({ existing: { id: 'j1', status: 'COMPLETED' } });
      await h.run(0);
      expect(h.updates).toEqual([]);
      expect(h.transcription.getTranscript).not.toHaveBeenCalled();
    });

    it('skips a job whose row has gone', async () => {
      const h = harness({ existing: null });
      await h.run(0);
      expect(h.updates).toEqual([]);
      expect(h.transcription.getTranscript).not.toHaveBeenCalled();
    });
  });

  describe('failure across attempts', () => {
    const privateVideo = () =>
      Promise.reject(new Error('ERROR: [youtube] x: Private video'));

    it('leaves the job PROCESSING while retries remain', async () => {
      for (const attemptsMade of [0, 1]) {
        const h = harness({ transcript: privateVideo });
        await expect(h.run(attemptsMade)).rejects.toThrow();

        expect(h.updates.map((u) => u.status)).toEqual(['PROCESSING']);
        // The SSE stream completes on FAILED. Writing it early showed a
        // terminal failure for a job that was still going.
        expect(h.updates.some((u) => u.status === 'FAILED')).toBe(false);
        // Audio is kept so the next attempt does not download it again.
        expect(h.cleanups).toBe(0);
      }
    });

    it('marks FAILED with a reason on the final attempt only', async () => {
      const h = harness({ transcript: privateVideo });
      await expect(h.run(2)).rejects.toThrow();

      const failed = h.updates.find((u) => u.status === 'FAILED');
      expect(failed).toBeDefined();
      expect(failed?.error).toMatch(/private or restricted/i);
      expect(h.cleanups).toBe(1);
    });

    it('never stores the raw exception text', async () => {
      const h = harness({
        transcript: () =>
          Promise.reject(
            new Error('Command failed: yt-dlp -o "C:\\Temp\\yt-audio-x.webm"'),
          ),
      });
      await expect(h.run(2)).rejects.toThrow();

      const failed = h.updates.find((u) => u.status === 'FAILED');
      expect(failed?.error).toBe(JOB_ERROR_FALLBACK);
      expect(failed?.error).not.toContain('yt-dlp');
      expect(failed?.error).not.toContain('Temp');
    });

    it('honours a single-attempt job', async () => {
      const h = harness({ transcript: privateVideo });
      await expect(h.run(0, 1)).rejects.toThrow();
      expect(h.updates.some((u) => u.status === 'FAILED')).toBe(true);
    });
  });

  describe('success', () => {
    it('generates every format and clears any previous error', async () => {
      const h = harness({});
      await h.run(0);

      expect(h.ai.generateContent).toHaveBeenCalledTimes(4);
      expect(h.updates[0]).toEqual({ status: 'PROCESSING', error: null });
      // The completion update goes through $transaction, so assert on that.
      expect(h.prisma.$transaction).toHaveBeenCalled();
      expect(h.cleanups).toBe(1);
    });

    it('asks for the transcript exactly once per attempt', async () => {
      const h = harness({});
      await h.run(0);
      // There used to be a 1..3 loop here nested inside BullMQ's own 3
      // attempts, so one job could transcribe nine times.
      expect(h.transcription.getTranscript).toHaveBeenCalledTimes(1);
      expect(h.transcription.getTranscript).toHaveBeenCalledWith(VIDEO_URL, 1);
    });
  });
});
