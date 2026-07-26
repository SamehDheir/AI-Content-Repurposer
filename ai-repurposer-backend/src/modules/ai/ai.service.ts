import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ContentType } from '@prisma/client';
import { getDialect } from '@/common/config/dialects.config';
import { stripAiTells } from './sanitize';

export type ExtendedContentType = ContentType | 'HIGHLIGHTS';

export interface GenerateOptions {
  language?: 'Arabic' | 'English';
  /** ISO-2 code from `dialects.config`. Absent means Modern Standard Arabic. */
  country?: string | null;
}

/**
 * The writing model, overridable without a code change.
 *
 * This is the ceiling on output quality, and for Arabic it is a low one. The
 * default 8B model honours every constraint in the prompt below — no emoji, no
 * em dashes, the right dialect markers — and still produces Arabic that is
 * frequently ungrammatical, and Darija that is close to word salad. No amount
 * of prompting fixes that; it is capacity. Point this at a larger multilingual
 * model when Arabic output matters.
 */
const TEXT_MODEL =
  process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.1-8b-instruct';

/**
 * Llama 3.1 8B is served with a 16k context on most OpenRouter providers, and a
 * long video overruns it before the instructions are even read. Roughly 12k
 * tokens of English, and less of Arabic, which tokenises far worse — leaving
 * headroom for the system prompt and the answer.
 */
const MAX_TRANSCRIPT_CHARS = 40_000;

/** A blog post in Arabic needs several times the budget of a thread. */
const MAX_TOKENS: Record<ExtendedContentType, number> = {
  TWITTER_THREAD: 1600,
  BLOG_POST: 3500,
  FACEBOOK_POST: 1200,
  HIGHLIGHTS: 1600,
};

const PROMPTS: Record<ExtendedContentType, string> = {
  TWITTER_THREAD: `Write a thread of 5 to 7 posts from this transcript.

- Post 1 states the single most surprising or useful thing in the video. Make it a claim, not a promise: say the thing, don't announce that you're about to say it. Never "here's what I learned" or "a thread".
- Posts 2 to 6 carry one idea each and stand on their own. Use the speaker's actual numbers, names and examples — a specific beats a generalisation every time.
- The last post is a plain closing thought or a real question. Not "follow for more", not "let me know below".
- Number them 1/7, 2/7 and so on. Keep every post under 280 characters.
- Separate posts with a blank line. No hashtags anywhere.`,

  BLOG_POST: `Write a blog post of roughly 700 to 1000 words from this transcript.

- Open with a concrete detail from the video: a number, a moment, a claim someone would argue with. No scene-setting about the modern world.
- One H1 title, in sentence case, specific enough that it could only be about this video.
- Three or four H2 sections. Each makes one point and backs it with something the speaker actually said.
- Vary the paragraph lengths. A one-sentence paragraph is allowed and lands harder than a bulleted list. Use at most one list in the whole post, and only if the content is genuinely a list.
- Bold at most two phrases. If nothing needs emphasis, bold nothing.
- End on a thought that goes somewhere, not a recap of what the reader just read.`,

  FACEBOOK_POST: `Write a Facebook post of 120 to 250 words from this transcript.

- Flowing paragraphs, the way a person writes on Facebook. No headings, no bullet points, no numbered lists.
- Open with one specific statement or a short moment from the video that makes someone stop scrolling.
- Work in the two or three things actually worth knowing, in prose.
- Close with a genuine question you would want an answer to.
- No hashtags.`,

  HIGHLIGHTS: `Pull the 4 to 6 moments in this transcript that are actually worth someone's time.

For each one, write:
- A short plain title on its own line. Under 8 words, sentence case, no icon or bracket.
- One or two sentences underneath saying what was said and why it matters. Quote the specific number, name or example that makes it worth pulling out.

Separate each with a blank line. Order them by how interesting they are, not by where they appear in the video.`,
};

/** Openers and vocabulary that read as machine-written in Arabic. */
const ARABIC_CLICHES = `"في عالمنا اليوم"، "في عصرنا الحالي"، "مما لا شك فيه"، "لا يخفى على أحد"، "يعتبر من أهم"، "دعونا نتعمق"، "في الختام"، "الجدير بالذكر"، "في هذا المقال سوف نتناول"`;

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly openrouter: OpenAI;

  constructor() {
    this.openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.FRONTEND_URL ?? 'http://localhost:3000',
        'X-Title': 'AI Content Repurposer',
      },
    });
  }

  /**
   * The language half of the system prompt.
   *
   * A dialect instruction has to be concrete or an 8B model writes one
   * colloquial sentence and slides back into Modern Standard Arabic for the
   * rest, which is worse than never asking: the register wobbles mid-post. So
   * the profile's marker words go in, and the drift is called out explicitly.
   */
  private voice(language: 'Arabic' | 'English', country?: string | null) {
    if (language === 'English') {
      return `LANGUAGE: English. Plain, modern, conversational. Contractions are fine.`;
    }

    const dialect = getDialect(country);

    if (!dialect) {
      return `LANGUAGE: Arabic — Modern Standard Arabic, but the light modern register of good Arabic media, not the classical or textbook one. Short sentences. Never a stiff, literal translation of English phrasing.

Avoid these worn-out Arabic openers and phrases: ${ARABIC_CLICHES}.`;
    }

    return `LANGUAGE: Arabic — write in ${dialect.dialect}, the everyday spoken Arabic of ${dialect.country}. Not Modern Standard Arabic.

- Write it the way people from ${dialect.country} actually type on their phones.
- Reach for these words where they fit naturally: ${dialect.markers}.
- Tone: ${dialect.register}
- Stay in the dialect from the first word to the last. Do not start colloquial and drift back into Modern Standard Arabic — that drift is the single most common mistake here.
- Keep technical terms, product names and brand names as they are. Do not translate them into formal Arabic.
- A reader from ${dialect.country} should be sure this was written by someone from ${dialect.country}.

Avoid these worn-out Arabic openers and phrases: ${ARABIC_CLICHES}.`;
  }

  /**
   * The rules that keep the output from announcing itself as generated. Kept
   * short and concrete on purpose: a small model follows ten sharp rules and
   * ignores forty vague ones.
   */
  private systemPrompt(
    language: 'Arabic' | 'English',
    country?: string | null,
  ) {
    return `You are a ghostwriter. You write the way one person talks to another, and nothing you write should look like it came from a machine.

${this.voice(language, country)}

NEVER USE:
- Emoji, icons, or decorative symbols. Not a single one, anywhere, including in headings and list items.
- The em dash (—). Use a comma or a full stop.
- Hashtags.
- Throat-clearing openers such as "In today's fast-paced world", "In an era where", "Let's dive in", "Have you ever wondered".
- These words: delve, unlock, unleash, harness, leverage, elevate, seamless, robust, landscape, realm, testament, game-changer, transformative, revolutionise.
- The constructions "it's not just X, it's Y" and "more than just".
- Signposting such as "Firstly", "Secondly", "In conclusion", "In summary".
- Bold text sprinkled over ordinary phrases, or a bulleted list where a sentence would do.

DO:
- Use the real specifics from the transcript — the numbers, the names, the examples, the thing the speaker got wrong. Specifics are what make writing sound human.
- Vary sentence length. Put a short sentence after a long one. A fragment is fine.
- Prefer the simple word. Say it plainly.
- Take a position. Flat neutrality reads as machine-written.
- Start where the interesting part is.

RULES:
- Use only what is in the transcript. Invent no facts, numbers, quotes or names.
- Output the finished piece and nothing else. No preamble, no title card, no notes about what you did, no code fences.`;
  }

  async generateContent(
    type: ExtendedContentType,
    transcript: string,
    options: GenerateOptions = {},
  ): Promise<string> {
    const { language = 'Arabic', country = null } = options;

    if (!transcript || transcript.trim().length < 50) {
      this.logger.warn(`Skipping "${type}": Transcript is too short.`);
      return 'Error: The provided transcript is too short to generate meaningful content.';
    }

    const truncated = transcript.length > MAX_TRANSCRIPT_CHARS;
    const source = truncated
      ? transcript.slice(0, MAX_TRANSCRIPT_CHARS)
      : transcript;

    if (truncated) {
      this.logger.warn(
        `Transcript truncated to ${MAX_TRANSCRIPT_CHARS} chars for "${type}".`,
      );
    }

    const dialect = getDialect(country);
    this.logger.log(
      `Generating "${type}" in ${language}${dialect ? ` (${dialect.country})` : ''}...`,
    );

    try {
      const response = await this.openrouter.chat.completions.create({
        model: TEXT_MODEL,
        max_tokens: MAX_TOKENS[type],
        // Higher than the old 0.7, with mild repetition penalties: the giveaway
        // in generated prose is not a wrong word, it is the same cadence in
        // every sentence.
        temperature: 0.85,
        top_p: 0.9,
        frequency_penalty: 0.2,
        presence_penalty: 0.2,
        messages: [
          {
            role: 'system',
            content: this.systemPrompt(language, country),
          },
          {
            role: 'user',
            content: `${PROMPTS[type]}

Transcript${truncated ? ' (first part of a longer video)' : ''}:
"""
${source}
"""

Write it now. Output only the finished piece.`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from AI provider.');
      }

      // The prompt asks for clean output; this guarantees it. See sanitize.ts.
      const cleaned = stripAiTells(content, language);

      if (!cleaned) {
        throw new Error('AI returned only formatting, no usable content.');
      }

      this.logger.log(`"${type}" generated successfully.`);
      return cleaned;
    } catch (error: any) {
      this.logger.error(`AI Generation Failed: ${error.message}`);
      if (error.status === 429) {
        throw new Error(
          'The service is currently busy, please try again in a minute',
        );
      }
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }
}
