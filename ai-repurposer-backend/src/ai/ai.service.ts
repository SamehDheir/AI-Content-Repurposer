import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ContentType } from '@prisma/client';

export type ExtendedContentType = ContentType | 'HIGHLIGHTS';

const PROMPTS: Record<ExtendedContentType, string> = {
  TWITTER_THREAD: 
    `Create a compelling Twitter thread (5-7 tweets) from this transcript:
    - Tweet 1: A powerful "Hook" that stops the scroll and addresses a core benefit.
    - Tweets 2-5: Practical value, tips, or insights using bullet points for readability.
    - Final Tweet: A strong Call to Action (CTA).
    - Style: Use thread numbering (1/n), relevant emojis, and keep each tweet < 280 chars.`,

  BLOG_POST: 
    `Write a professional, SEO-friendly blog post based on this transcript:
    - Structure: H1 Title, engaging intro using the "PAS" (Problem-Agitation-Solution) framework.
    - Body: 3-4 distinct H2 sections with detailed explanations.
    - Formatting: Use bold text for key concepts and bullet points for lists.
    - Conclusion: A summary paragraph and a final thought.`,

  FACEBOOK_POST: 
    `Craft an engaging Facebook post for a professional audience:
    - Opening: Start with a relatable question or a bold statement.
    - Core: Share 3 main takeaways from the content.
    - Closing: Encourage engagement with a question for the readers.
    - Tone: Friendly, authoritative, and community-focused.`,

  HIGHLIGHTS: 
    `Extract the "Golden Nuggets" (the most impactful moments) from this transcript:
    - Identify 3-5 key highlights.
    - For each highlight: Provide a 💡 [Catchy Title] followed by a 2-sentence explanation of its importance.`,
};

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly openrouter: OpenAI;

  constructor() {
    this.openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000', 
        'X-Title': 'AI Content Repurposer',
      },
    });
  }

  async generateContent(
    type: ExtendedContentType,
    transcript: string,
    targetLanguage: 'Arabic' | 'English' = 'Arabic',
  ): Promise<string> {
    // 1. Validation
    if (!transcript || transcript.trim().length < 50) {
      this.logger.warn(`Skipping "${type}": Transcript is too short.`);
      return 'Error: The provided transcript is too short to generate meaningful content.';
    }

    this.logger.log(`🚀 Generating "${type}" in ${targetLanguage}...`);

    try {
      const response = await this.openrouter.chat.completions.create({
        model: 'qwen/qwen-2.5-72b-instruct:free',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `You are a world-class Content Strategist and Copywriter.
            - Target Language: ${targetLanguage}.
            - Tone: Engaging, professional, and natural. 
            - If Arabic: Use Modern Standard Arabic (لغة بيضاء فصيحة) that is suitable for social media. Avoid literal or stiff translations.
            - Constraint: Only use the information provided in the transcript.
            - Quality: Ensure the output is ready to be published immediately.`,
          },
          {
            role: 'user',
            content: `Task: ${PROMPTS[type]}\n\nTranscript Content:\n${transcript}`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from AI provider.');
      }

      this.logger.log(`✅ "${type}" generated successfully.`);
      return content;

    } catch (error: any) {
      this.logger.error(`❌ AI Generation Failed: ${error.message}`);
      if (error.status === 429) {
        throw new Error('الخدمة مزدحمة حالياً، يرجى المحاولة بعد دقيقة.');
      }
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }
}