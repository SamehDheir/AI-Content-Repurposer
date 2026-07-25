import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly baseUrl = 'https://image.pollinations.ai/prompt';

  private readonly openrouter = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey:  process.env.OPENROUTER_API_KEY,
  });

  async generateImageFromContent(
    content:     string,
    contentType: string,
  ): Promise<string> {
    this.logger.log(`🧠 Building smart prompt for: ${contentType}`);

    const prompt = await this.buildSmartPrompt(content, contentType);
    this.logger.log(`✅ Prompt ready: ${prompt.slice(0, 80)}...`);

    return this.generateImage(prompt);
  }

  async generateImage(
    prompt:   string,
    options?: { width?: number; height?: number; seed?: number },
  ): Promise<string> {
    const {
      width  = 1280,
      height = 720,
      seed   = Math.floor(Math.random() * 999999),
    } = options ?? {};

    const encoded = encodeURIComponent(prompt);
    const longUrl =
      `${this.baseUrl}/${encoded}` +
      `?width=${width}&height=${height}` +
      `&model=flux` +
      `&seed=${seed}` +
      `&nologo=true` +
      `&enhance=true`;

    this.logger.log(`🎨 Image URL generated`);

    // Shorten the URL using tinyurl
    try {
      const shortUrl = await this.shortenUrl(longUrl);
      this.logger.log(`🔗 URL shortened: ${shortUrl}`);
      return shortUrl;
    } catch (error) {
      this.logger.warn(`⚠️ Failed to shorten URL, using original: ${error}`);
      return longUrl;
    }
  }

  private async shortenUrl(longUrl: string): Promise<string> {
    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
    if (!response.ok) {
      throw new Error(`TinyURL API failed: ${response.statusText}`);
    }
    const shortUrl = await response.text();
    return shortUrl;
  }

  private async buildSmartPrompt(
    content:     string,
    contentType: string,
  ): Promise<string> {
    const styleGuide: Record<string, string> = {
      TWITTER_THREAD: 'modern flat design, bold typography, electric blue and white palette, social media banner style, 16:9',
      BLOG_POST:      'editorial photography style, cinematic lighting, professional, warm tones, magazine cover quality',
      FACEBOOK_POST:  'vibrant lifestyle photography, warm inviting atmosphere, community feel, natural lighting',
      HIGHLIGHTS:     'minimal infographic style, clean icons, professional business, data visualization aesthetic',
    };

    const style = styleGuide[contentType] ?? 'professional digital illustration, clean modern design';

    const trimmed = content.length > 1500
      ? content.slice(0, 1500) + '...'
      : content;

    try {
      const response = await this.openrouter.chat.completions.create({
        model:      'meta-llama/llama-3.3-8b-instruct:free',
        max_tokens: 120,
        messages: [
          {
            role:    'system',
            content: `You are an expert at writing Stable Diffusion / Flux image prompts.
Your job: read the content and write ONE image generation prompt (max 100 words).
Rules:
- Focus on the CORE TOPIC and MAIN MESSAGE of the content
- Be very specific and visual — describe a real scene or concept
- End with: ${style}
- NO quotes, NO explanation, just the prompt
- Write in English only`,
          },
          {
            role:    'user',
            content: `Content type: ${contentType}\n\nContent:\n${trimmed}\n\nWrite the image prompt:`,
          },
        ],
      });

      const prompt = response.choices[0]?.message?.content?.trim() ?? '';

      if (prompt.length > 20) return prompt;

      return this.fallbackPrompt(content, style);

    } catch (err: any) {
      this.logger.warn(`⚠️ AI prompt failed, using fallback: ${err.message}`);
      return this.fallbackPrompt(content, style);
    }
  }

  private fallbackPrompt(content: string, style: string): string {
    const sentences = content
      .replace(/[#*\n]+/g, ' ')
      .split(/[.!?]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 30)
      .slice(0, 3)
      .join('. ');

    const topic = sentences.slice(0, 200);
    return `Professional illustration representing: ${topic}. ${style}, high quality, 4k`;
  }
}