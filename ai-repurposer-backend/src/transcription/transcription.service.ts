import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Innertube } from 'youtubei.js';
import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private readonly groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  async getTranscript(videoUrl: string): Promise<string> {
    const videoId = this.extractVideoId(videoUrl);

    if (!videoId) {
      throw new BadRequestException('Invalid YouTube URL or video ID');
    }

    this.logger.log(`Fetching transcript for video: ${videoId}`);

    // Strategy 1: Captions
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

    // Strategy 2: Whisper
    this.logger.log('🎙️ Falling back to Whisper transcription...');
    return await this.transcribeWithWhisper(videoUrl, videoId);
  }

  private async fetchCaptions(videoId: string): Promise<string> {
    const youtube = await Innertube.create({ retrieve_player: false });
    const info = await youtube.getInfo(videoId);
    const transcriptData = await info.getTranscript();

    const segments =
      transcriptData?.transcript?.content?.body?.initial_segments ?? [];

    if (segments.length === 0) throw new Error('No caption segments found');

    return segments
      .map((seg: any) => seg?.snippet?.text ?? '')
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  private async transcribeWithWhisper(
    videoUrl: string,
    videoId: string,
  ): Promise<string> {
    const tmpFile = path.join(os.tmpdir(), `yt-audio-${videoId}.m4a`);

    try {
      this.logger.log(`⬇️ Downloading audio via yt-dlp...`);
      await execAsync(
        `yt-dlp -f bestaudio --no-playlist -o "${tmpFile}" "${videoUrl}"`,
      );

      const fileSizeMB = fs.statSync(tmpFile).size / (1024 * 1024);
      this.logger.log(`📦 Audio size: ${fileSizeMB.toFixed(1)} MB`);

      if (fileSizeMB > 24) {
        throw new Error(
          `Audio too large: ${fileSizeMB.toFixed(1)}MB (max 24MB)`,
        );
      }

      this.logger.log(`📤 Sending to Whisper...`);
      const transcription = await this.groq.audio.transcriptions.create({
        file: fs.createReadStream(tmpFile),
        model: 'whisper-large-v3-turbo',
        response_format: 'text',
        language: 'en',
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
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
        this.logger.log(`🗑️ Temp file deleted`);
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
