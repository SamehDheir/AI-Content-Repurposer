import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { getDialect } from '@/common/config/dialects.config';

/**
 * The model that writes the image prompt.
 *
 * It has to read the generated post, which is usually Arabic, and describe a
 * scene in English. That is a cross-lingual comprehension job, and an 8B model
 * is poor at it — which is the main reason images drifted off-topic. Follows
 * `OPENROUTER_MODEL` by default so upgrading the writing model upgrades this
 * too; the call is ~800 tokens, so it costs a fraction of a cent either way.
 */
const IMAGE_PROMPT_MODEL =
  process.env.OPENROUTER_IMAGE_MODEL ??
  process.env.OPENROUTER_MODEL ??
  'meta-llama/llama-3.1-8b-instruct';

/**
 * The image model renders lettering whenever a prompt names a genre that
 * normally carries words, and it always comes out as mangled pseudo-text — the
 * fastest way for a viewer to clock an image as generated. So every style is a
 * photographic genre with nothing written in it. The old "bold typography",
 * "magazine cover" and "infographic" styles were asking for exactly that
 * artefact.
 *
 * The lens and film notes are not decoration. Naming a focal length and grain
 * pushes the output towards photography and away from the plastic, over-lit
 * "AI render" look that the model otherwise defaults to.
 */
const STYLE_GUIDE: Record<string, string> = {
  TWITTER_THREAD:
    'editorial conceptual photograph, 35mm, natural light, shallow depth of field, muted slate and blue palette, generous negative space, subtle film grain',
  BLOG_POST:
    'cinematic editorial photograph, 50mm, soft natural window light, warm neutral palette, unposed documentary feel, subtle film grain',
  FACEBOOK_POST:
    'candid lifestyle photograph, 35mm, golden hour backlight, warm tones, softly blurred background, unstaged, subtle film grain',
  HIGHLIGHTS:
    'still life photograph, 85mm, single subject on a plain seamless backdrop, soft directional studio light, restrained palette, generous negative space',
};

const DEFAULT_STYLE =
  'understated editorial photograph, 50mm, natural light, clean composition, muted palette, subtle film grain';

/**
 * Appended to every prompt, whoever wrote it. The GET endpoint has no
 * negative-prompt parameter, so exclusions have to ride along in the prompt.
 */
const NO_TEXT =
  'no text, no words, no letters, no numbers, no captions, no labels, no signage, no logo, no watermark, no user interface, no posters, no whiteboards, no documents, no book covers';

/**
 * Hands and faces are where this model fails most visibly, and a malformed hand
 * gives an image away faster than anything else in it. Observed directly: a
 * scene described only as "person typing at a desk" came back with a hand as a
 * pink blob of fingers.
 */
const NO_ANATOMY = 'no visible hands, no visible faces, no close-up of people';

/** Pushes away from the glossy CGI look the model reaches for unprompted. */
const REALISM =
  'photographic, real textures, natural imperfections, not a 3d render, not an illustration, not digital art';

/** The prompt travels in the URL path, so it cannot grow without bound. */
const MAX_SCENE_CHARS = 700;

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly baseUrl = 'https://image.pollinations.ai/prompt';

  private readonly openrouter = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': process.env.FRONTEND_URL ?? 'http://localhost:3000',
      'X-Title': 'AI Content Repurposer',
    },
  });

  async generateImageFromContent(
    content: string,
    contentType: string,
    options: { country?: string | null } = {},
  ): Promise<string> {
    this.logger.log(`Building image prompt for: ${contentType}`);

    const prompt = await this.buildSmartPrompt(
      content,
      contentType,
      options.country,
    );
    this.logger.log(`Prompt ready: ${prompt.slice(0, 80)}...`);

    return this.generateImage(prompt);
  }

  async generateImage(
    prompt: string,
    options?: { width?: number; height?: number; seed?: number },
  ): Promise<string> {
    // Measured against the live endpoint: the service caps output at 1024x576
    // for 16:9 whatever is asked for — 1280x720 and 1920x1080 both come back
    // 1024x576, byte for byte. So these only choose the aspect ratio.
    const {
      width = 1280,
      height = 720,
      seed = Math.floor(Math.random() * 999999),
    } = options ?? {};

    const encoded = encodeURIComponent(this.finalise(prompt));
    const longUrl =
      `${this.baseUrl}/${encoded}` +
      `?width=${width}&height=${height}` +
      // Also measured: `model` is currently a no-op. The live /models endpoint
      // offers only "sana", and flux and sana return an identical image for the
      // same seed. Kept so the request is right if more models come back.
      `&model=flux` +
      `&seed=${seed}` +
      `&nologo=true` +
      // Pollinations' own LLM rewrite. It used to be the only thing shaping the
      // prompt, because the model id below was wrong and every "smart" prompt
      // silently fell back. Now that we write a real prompt, the rewrite only
      // undoes it — and it likes to add the lettering NO_TEXT rules out.
      `&enhance=false` +
      // These are someone's video and their content. Keep the result out of the
      // public feed.
      `&private=true` +
      `&safe=true`;

    this.logger.log('Image URL generated');

    try {
      const shortUrl = await this.shortenUrl(longUrl);
      this.logger.log('URL shortened');
      return shortUrl;
    } catch (error) {
      this.logger.warn(`Failed to shorten URL, using original: ${error}`);
      return longUrl;
    }
  }

  /** Trim, cap, and append the exclusions exactly once. */
  private finalise(prompt: string): string {
    let scene = prompt.replace(/\s+/g, ' ').trim();

    if (scene.length > MAX_SCENE_CHARS) {
      scene = scene.slice(0, MAX_SCENE_CHARS).replace(/[\s,]+\S*$/, '');
    }

    if (scene.toLowerCase().includes('no text')) return scene;
    return `${scene}. ${REALISM}. ${NO_TEXT}, ${NO_ANATOMY}`;
  }

  private async shortenUrl(longUrl: string): Promise<string> {
    const response = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`,
    );
    if (!response.ok) {
      throw new Error(`TinyURL API failed: ${response.statusText}`);
    }
    return response.text();
  }

  /**
   * Pick what the prompt model gets to read.
   *
   * This used to be `content.slice(0, 1500)` — the opening of the post, which
   * is the hook and frequently the part that says least about the subject. A
   * post whose first paragraph is a rhetorical question gave the model nothing
   * to work with, and it invented a scene. Sampling the title plus points from
   * across the whole piece keeps the topic in view.
   */
  private condense(content: string, budget = 1800): string {
    const text = content
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/!?\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ');

    const heading = /^#{1,3}\s*(.+)$/m.exec(text)?.[1]?.trim();

    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) =>
        p
          .replace(/^[#>\-*\d.)\s]+/, '')
          .replace(/\s+/g, ' ')
          .trim(),
      )
      .filter((p) => p.length > 40);

    if (!paragraphs.length)
      return text.replace(/\s+/g, ' ').trim().slice(0, budget);

    // Opening, something from the middle, and the close: the arc of the piece
    // rather than its first screenful.
    const picks = new Set<number>([
      0,
      Math.floor(paragraphs.length / 2),
      paragraphs.length - 1,
    ]);
    if (paragraphs.length > 3) picks.add(1);

    const parts = heading ? [heading] : [];
    [...picks].sort((a, b) => a - b).forEach((i) => parts.push(paragraphs[i]));

    return parts.join('\n').slice(0, budget);
  }

  private async buildSmartPrompt(
    content: string,
    contentType: string,
    country?: string | null,
  ): Promise<string> {
    const style = STYLE_GUIDE[contentType] ?? DEFAULT_STYLE;
    const dialect = getDialect(country);

    // A post written for readers in Cairo should not be illustrated with a
    // generic American office.
    const setting = dialect
      ? `The audience is in ${dialect.country}. Where the scene involves people, a place or objects, make them plausibly ${dialect.country}. Do not turn it into a postcard of national landmarks.`
      : `Keep the setting neutral and not tied to any one country.`;

    try {
      const response = await this.openrouter.chat.completions.create({
        model: IMAGE_PROMPT_MODEL,
        max_tokens: 260,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `You write prompts for a text-to-image model.

The excerpt may be in Arabic. Your answer is always in English.

Answer in exactly two labelled lines:

SUBJECT: one sentence naming what this content is actually about. The real topic, not the format. Read the whole excerpt before deciding.
SCENE: 40 to 70 words describing ONE photograph a reader would recognise as being about that subject.

Rules for SCENE:
- Anchor it to a specific object, place or moment the content actually mentions, and name that thing. If the content is about selling a course through one-to-one conversations, show a phone face down on a kitchen table beside a cooling glass of tea. Something from the story.
- Never "a person at a desk with a laptop". That is the generic scene this model falls back on and it illustrates nothing.
- No metaphors, no abstractions, no floating symbols, no glowing orbs, no arrows, no charts, no brains, no handshakes over a globe.
- No visible faces and no visible hands. This model mangles both and it is the clearest sign an image was generated. Best is a scene with no people in it at all. If someone must appear, they are seen from behind, in silhouette, or far enough away that a face reads as shape rather than detail.
- Nothing in frame that carries writing: no books, posters, whiteboards, documents, packaging, signs, or screens showing an interface. A closed laptop, or a screen seen from behind, is fine.
- Say what is in frame: the subject, the surroundings, the light, the mood, and the framing (wide shot, low angle, overhead, from behind).
- ${setting}
- End the SCENE with exactly: ${style}

Output only those two lines. No preamble, no quotes, no markdown.`,
          },
          {
            role: 'user',
            content: `Content type: ${contentType}\n\nExcerpt:\n${this.condense(content)}`,
          },
        ],
      });

      const raw = response.choices[0]?.message?.content ?? '';
      const { subject, scene } = this.parse(raw);

      if (scene.length > 20) {
        // Logged because when an image looks unrelated, this line says whether
        // the model misread the content or just drew the subject badly.
        this.logger.log(`Image subject: ${subject || '(unlabelled)'}`);
        return scene;
      }

      this.logger.warn('Prompt model returned too little, using fallback');
      return this.fallbackPrompt(style);
    } catch (err: any) {
      this.logger.warn(`AI prompt failed, using fallback: ${err.message}`);
      return this.fallbackPrompt(style);
    }
  }

  /**
   * Split the two labelled lines. Small models drop the labels often enough
   * that an unlabelled answer is treated as the scene rather than discarded.
   */
  private parse(raw: string): { subject: string; scene: string } {
    const text = this.clean(raw);
    const sceneAt = /SCENE\s*:/i.exec(text);

    if (!sceneAt) return { subject: '', scene: text };

    const subject = text
      .slice(0, sceneAt.index)
      .replace(/^SUBJECT\s*:/i, '')
      .trim();
    const scene = this.clean(text.slice(sceneAt.index + sceneAt[0].length));

    return { subject, scene };
  }

  /** Small models wrap the answer in quotes or a label however firmly you ask. */
  private clean(raw: string): string {
    return raw
      .trim()
      .replace(/^```[a-z]*\s*|\s*```$/gi, '')
      .replace(/^(?:image\s+)?prompt\s*[:-]\s*/i, '')
      .replace(/^["'«»]+|["'«»]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Used when the prompt model is unreachable. Deliberately carries no words
   * from the content at all: the previous version spliced sentences straight
   * into the prompt, so an Arabic post put Arabic script into the image prompt
   * and the model dutifully rendered Arabic-looking gibberish across the
   * picture. A generic scene that looks right beats a specific one that does
   * not, and this path only runs when the alternative is no image.
   */
  private fallbackPrompt(style: string): string {
    return `A quiet still life on a worn wooden table beside a window: a closed notebook, a plain ceramic cup, a pair of folded glasses, late afternoon light raking across the grain. ${style}`;
  }
}
