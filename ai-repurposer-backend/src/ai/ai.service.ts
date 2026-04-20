import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';
import { ContentType } from '@prisma/client';

const PROMPTS: Record<ContentType, string> = {
  TWITTER_THREAD:
    'Summarize this transcript into a compelling 5-tweet Twitter thread. Each tweet must be under 280 characters. Use hooks, emojis, and number each tweet (1/5, 2/5...).',
  BLOG_POST:
    'Write a professional SEO-optimized blog post based on this transcript. Include an H1 title, an intro paragraph, 3-5 H2 sections with detailed content, and a conclusion.',
  FACEBOOK_POST:
    'Create an engaging Facebook post for a professional audience based on this video content. Include a hook, key takeaways, and a call-to-action.',
};

const MIN_TRANSCRIPT_LENGTH = 20;

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  async generateContent(
    type: ContentType,
    transcript: string,
  ): Promise<string> {
    if (!transcript || transcript.trim().length < MIN_TRANSCRIPT_LENGTH) {
      this.logger.warn(
        `Skipping generation for type "${type}": transcript too short`,
      );
      return 'Error: No sufficient transcript provided to generate content.';
    }

    this.logger.log(`Generating "${type}" content...`);

    try {
      const response = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert content repurposer. Use only the provided transcript to fulfill the request. Be creative but accurate.',
          },
          {
            role: 'user',
            content: `Task: ${PROMPTS[type]}\n\nTranscript:\n${transcript}`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from AI model');
      }

      this.logger.log(`"${type}" content generated successfully`);
      return content;
    } catch (error: any) {
      this.logger.error(
        `Failed to generate "${type}" content: ${error.message}`,
      );
      throw new Error(
        `AI generation failed for type "${type}": ${error.message}`,
      );
    }
  }
}
