import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ContentType } from '@prisma/client';

export type ExtendedContentType = ContentType | 'HIGHLIGHTS';

const PROMPTS: Record<ExtendedContentType, string> = {
  TWITTER_THREAD:
    'Summarize this transcript into a compelling 5-tweet Twitter thread. Each tweet must be under 280 characters. Use hooks, emojis, and number each tweet (1/5, 2/5...).',
  BLOG_POST:
    'Write a professional SEO-optimized blog post based on this transcript. Include an H1 title, an intro paragraph, 3-5 H2 sections with detailed content, and a conclusion.',
  FACEBOOK_POST:
    'Create an engaging Facebook post for a professional audience based on this video content. Include a hook, key takeaways, and a call-to-action.',
  HIGHLIGHTS:
    'Identify the 3-5 most impactful moments or "Golden Nuggets" from this transcript. For each highlight, provide a catchy title and a brief explanation of why it matters.',
};

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  private readonly openrouter = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  async generateContent(
    type: ExtendedContentType,
    transcript: string,
    targetLanguage: 'Arabic' | 'English' = 'Arabic',
  ): Promise<string> {
    if (!transcript || transcript.trim().length < 20) {
      this.logger.warn(
        `Skipping generation for type "${type}": transcript too short`,
      );
      return 'Error: No sufficient transcript provided to generate content.';
    }

    this.logger.log(
      `Generating "${type}" in ${targetLanguage} via OpenRouter...`,
    );

    try {
      const response = await this.openrouter.chat.completions.create({
        model: 'qwen/qwen3-8b:freeQwen/Qwen2.5-72B-Instruct',
        max_tokens: 1500,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `You are an expert content repurposer and social media strategist.
- Language: All output MUST be in ${targetLanguage}.
- Tone: Professional, engaging, and authoritative.
- If Arabic, use modern standard Arabic suitable for LinkedIn and Facebook.
- Use only the provided transcript for information.`,
          },
          {
            role: 'user',
            content: `Task: ${PROMPTS[type]}\n\nTranscript:\n${transcript}`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenRouter');

      this.logger.log(`✅ "${type}" generated successfully`);
      return content;
    } catch (error: any) {
      this.logger.error(`Failed to generate "${type}": ${error.message}`);
      throw new Error(`AI generation failed for "${type}": ${error.message}`);
    }
  }
}
