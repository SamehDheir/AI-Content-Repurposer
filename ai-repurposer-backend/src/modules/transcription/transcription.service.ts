import {
  Injectable,
  Logger,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { Innertube } from 'youtubei.js';
import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

import { extractVideoId } from '@/common/utils/youtube.util';

/**
 * `execFile`, never `exec`.
 *
 * `exec` hands the whole command to `/bin/sh -c`, and this service used to build
 * that string by interpolating the job's `videoUrl` into it. Inside double
 * quotes sh still expands `$(...)` and backticks, and the DTO's URL regex was
 * anchored only at the start, so `https://youtu.be/<11 chars>$(...)` satisfied
 * both `@IsUrl` and `@Matches` and reached the shell. That was remote code
 * execution for any signed-up user, replayed from `job.data` on every retry.
 *
 * `execFile` takes an argv array and spawns the binary directly, so no argument
 * is ever parsed as shell syntax.
 */
const execFileAsync = promisify(execFile);

/** yt-dlp gets a URL we built, never one a user typed. See `canonicalUrl`. */
function canonicalUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/** A wedged download must not hold a worker slot forever. */
const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000;

@Injectable()
export class TranscriptionService implements OnModuleInit {
  private readonly logger = new Logger(TranscriptionService.name);
  private readonly groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
    timeout: 20 * 60 * 1000,
  });

  /**
   * yt-dlp is an undeclared system dependency. Without it, only videos that
   * already have YouTube captions can process, and the failure otherwise
   * surfaces three retries deep inside a job rather than at startup.
   */
  async onModuleInit(): Promise<void> {
    try {
      const { stdout } = await execFileAsync('yt-dlp', ['--version']);
      this.logger.log(`yt-dlp ${stdout.trim()} detected`);
    } catch {
      this.logger.warn(
        'yt-dlp not found on PATH — Whisper fallback is unavailable, so only ' +
          'videos with existing YouTube captions will process. Install it from ' +
          'https://github.com/yt-dlp/yt-dlp and ensure it is on PATH.',
      );
    }
  }

  async getTranscript(videoUrl: string): Promise<string> {
    const videoId = extractVideoId(videoUrl);
    if (!videoId)
      throw new BadRequestException('Invalid YouTube URL or video ID');

    this.logger.log(`Fetching transcript for video: ${videoId}`);

    try {
      const transcript = await this.fetchCaptions(videoId);
      if (transcript && transcript.trim().length > 20) {
        this.logger.log(
          `✅ Captions found. Length: ${transcript.length} chars`,
        );
        return transcript;
      }
    } catch (err: any) {
      this.logger.warn(`⚠️ No captions available: ${err.message}`);
    }

    this.logger.log('🎙️ Falling back to Whisper transcription...');
    return await this.transcribeWithWhisper(videoId, 1);
  }

  // Takes the extracted id rather than the URL: the caller's string never
  // reaches the subprocess, so there is nothing to escape.
  async retryTranscription(videoId: string, attempt: number): Promise<string> {
    return await this.transcribeWithWhisper(videoId, attempt, true);
  }

  async cleanupAudioFile(videoId: string): Promise<void> {
    const tmpFile = path.join(os.tmpdir(), `yt-audio-${videoId}.webm`);
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
      this.logger.log(`🗑️ Audio file deleted: ${tmpFile}`);
    }
  }

  private async fetchCaptions(videoId: string): Promise<string> {
    const youtube = await Innertube.create({ retrieve_player: false });
    const info = await youtube.getInfo(videoId);
    const transcriptData = await info.getTranscript();

    const segments =
      transcriptData?.transcript?.content?.body?.initial_segments ?? [];

    if (segments.length === 0)
      throw new Error(
        'Transcript panel not found. Video likely has no transcript.',
      );

    return segments
      .map((seg: any) => seg?.snippet?.text ?? '')
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  private async transcribeWithWhisper(
    videoId: string,
    attempt: number = 1,
    useExistingFile: boolean = false,
  ): Promise<string> {
    const tmpFile = path.join(os.tmpdir(), `yt-audio-${videoId}.webm`);

    try {
      if (!useExistingFile || !fs.existsSync(tmpFile)) {
        this.logger.log(`⬇️ Downloading audio via yt-dlp (no ffmpeg)...`);

        // One argv entry per argument. The quotes that used to wrap the format
        // selector and the paths were shell quoting and must not survive here —
        // execFile passes each element through verbatim.
        //
        // The runtime is named `node`, not `nodejs`. yt-dlp does not fail on an
        // unknown name — it warns, drops the runtime, and then cannot extract
        // from YouTube at all, reporting the misleading "This video is not
        // available" for videos that are perfectly available.
        await execFileAsync(
          'yt-dlp',
          [
            '--js-runtimes',
            'node',
            '-f',
            'bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio',
            '--no-playlist',
            '-o',
            tmpFile,
            canonicalUrl(videoId),
          ],
          { timeout: DOWNLOAD_TIMEOUT_MS },
        );

        const fileSizeMB = fs.statSync(tmpFile).size / (1024 * 1024);
        this.logger.log(`📦 Audio size: ${fileSizeMB.toFixed(1)} MB`);

        if (fileSizeMB > 24) {
          throw new Error(
            `Audio too large: ${fileSizeMB.toFixed(1)}MB (max 24MB)`,
          );
        }
      } else {
        this.logger.log(`📁 Using existing audio file (attempt ${attempt})`);
      }

      this.logger.log(`📤 Sending to Groq Whisper (attempt ${attempt})...`);

      const transcription = await this.groq.audio.transcriptions.create({
        file: fs.createReadStream(tmpFile),
        model: 'whisper-large-v3-turbo',
        response_format: 'text',
      });

      const result =
        typeof transcription === 'string'
          ? transcription
          : ((transcription as any).text ?? '');

      if (!result || result.trim().length < 20) {
        throw new Error('Whisper returned empty transcript');
      }

      this.logger.log(`✅ Whisper done. Length: ${result.length} chars`);
      return result.trim();
    } finally {
      // Only delete file on success or after max attempts
      if (useExistingFile && attempt >= 3) {
        if (fs.existsSync(tmpFile)) {
          fs.unlinkSync(tmpFile);
          this.logger.log(`🗑️ Audio file deleted after ${attempt} attempts`);
        }
      } else if (!useExistingFile) {
        // First attempt - keep file for potential retry
        this.logger.log(`📁 Keeping audio file for potential retry`);
      }
    }
  }
}
