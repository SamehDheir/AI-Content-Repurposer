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
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
      const { stdout } = await execAsync('yt-dlp --version');
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
    const videoId = this.extractVideoId(videoUrl);
    if (!videoId) throw new BadRequestException('Invalid YouTube URL or video ID');

    this.logger.log(`Fetching transcript for video: ${videoId}`);

    try {
      const transcript = await this.fetchCaptions(videoId);
      if (transcript && transcript.trim().length > 20) {
        this.logger.log(`✅ Captions found. Length: ${transcript.length} chars`);
        return transcript;
      }
    } catch (err: any) {
      this.logger.warn(`⚠️ No captions available: ${err.message}`);
    }

    this.logger.log('🎙️ Falling back to Whisper transcription...');
    return await this.transcribeWithWhisper(videoUrl, videoId, 1);
  }

  async retryTranscription(videoUrl: string, videoId: string, attempt: number): Promise<string> {
    return await this.transcribeWithWhisper(videoUrl, videoId, attempt, true);
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
      throw new Error('Transcript panel not found. Video likely has no transcript.');

    return segments
      .map((seg: any) => seg?.snippet?.text ?? '')
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  private async transcribeWithWhisper(
    videoUrl: string,
    videoId: string,
    attempt: number = 1,
    useExistingFile: boolean = false,
  ): Promise<string> {
    const tmpFile = path.join(os.tmpdir(), `yt-audio-${videoId}.webm`);

    try {
      if (!useExistingFile || !fs.existsSync(tmpFile)) {
        this.logger.log(`⬇️ Downloading audio via yt-dlp (no ffmpeg)...`);

        await execAsync(
          `yt-dlp --js-runtimes nodejs` +
          ` -f "bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio"` +
          ` --no-playlist` +
          ` -o "${tmpFile}"` +
          ` "${videoUrl}"`,
        );

        const fileSizeMB = fs.statSync(tmpFile).size / (1024 * 1024);
        this.logger.log(`📦 Audio size: ${fileSizeMB.toFixed(1)} MB`);

        if (fileSizeMB > 24) {
          throw new Error(`Audio too large: ${fileSizeMB.toFixed(1)}MB (max 24MB)`);
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

  private extractVideoId(url: string): string | null {
    if (!url) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();

    const regExp =
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  }
}
