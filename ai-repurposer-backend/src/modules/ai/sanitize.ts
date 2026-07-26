/**
 * Post-processing that removes the marks a reader uses to spot machine writing.
 *
 * The prompt asks for all of this too, but an 8B model obeys a negative
 * instruction perhaps nine times in ten, and one rocket emoji is enough to give
 * the whole post away. Prompting sets the voice; this guarantees the surface.
 *
 * Everything here is deliberately conservative — it deletes decoration and
 * rewrites nothing that carries meaning. Arabic script, Arabic punctuation
 * (،؛؟) and markdown structure all pass through untouched.
 */

/** `1️⃣` is three code points; strip the sequence before its digit is orphaned. */
const KEYCAP = /[0-9#*]️?⃣/g;

/**
 * Emoji proper, flags, and the invisible modifiers that join them into
 * sequences: skin tones, the two variation selectors, and the zero-width
 * joiner.
 *
 * Written as an alternation rather than one character class on purpose. The
 * joiners are exactly the "combined characters" that `no-misleading-character-
 * class` warns about inside a class, and they are escaped rather than typed
 * because all three render as nothing in source.
 */
const PICTOGRAPHIC =
  /\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|︎|️|‍/gu;

/**
 * Decorative marks outside the emoji block that get used as bullets and badges.
 * Kept explicit rather than sweeping whole Unicode blocks, so that mathematical
 * and currency symbols in a genuine quote survive.
 */
const DECORATIVE =
  /[★☆✦✧✩✪✫✬✭✮✯✰✱✲✳✴✵✶✷✸✹✺❂❉❊❋♦♢♥♡♣♠▪▫◾◽◼◻■□▰▱●○◉◎◆◇►▶▷◀◁‣⁃⦿⦾➤➣➢➔➜➝➞➟➠➡➥➦➧⇒⇨↠↣⟶⟹※〓✓✔✗✘✕✖]/g;

/**
 * Openers the model bolts on when it treats the request as a chat turn rather
 * than a writing job. Only ever matched against the very first line.
 *
 * The Arabic branch closes on a lookahead rather than `\b`, because JavaScript
 * defines a word boundary over ASCII only: after Arabic script both sides of
 * the position are non-word characters, so `\b` never matches there.
 */
const PREAMBLE =
  /^(?:sure|certainly|of course|absolutely|great)\b[^\n]*:?\s*$|^here(?:'s| is| are)\b[^\n]*:\s*$|^(?:بالتأكيد|طبعا|طبعاً|أكيد|إليك|إليكم|هذا هو|تفضل|تفضلي)(?=[\s،,:.!؟]|$)[^\n]*:?\s*$/i;

/** A ``` fence wrapped around the whole answer, occasionally with a language tag. */
const WRAPPING_FENCE = /^```[a-z]*\s*\n([\s\S]*?)\n?```\s*$/i;

/**
 * The spaced em dash is the single most recognisable tell in generated prose,
 * and neither Arabic nor ordinary social writing reaches for it. Replaced with
 * the comma the sentence wanted. Unspaced dashes between digits are left alone
 * so that a range like 2020–2024 survives.
 */
function replaceDashes(text: string, separator: string): string {
  return text
    .replace(/\s+[—–]\s+/g, separator)
    .replace(/(?<=\p{L})\s*[—–]\s*(?=\p{L})/gu, separator);
}

export function stripAiTells(
  raw: string,
  language: 'Arabic' | 'English' = 'Arabic',
): string {
  if (!raw) return '';

  let text = raw.trim();

  const fenced = WRAPPING_FENCE.exec(text);
  if (fenced) text = fenced[1].trim();

  // Only the opening line, and only when there is a post left underneath it.
  const firstBreak = text.indexOf('\n');
  if (firstBreak > 0) {
    const [head, ...rest] = text.split('\n');
    const body = rest.join('\n').trim();
    if (body && head.length < 120 && PREAMBLE.test(head.trim())) {
      text = body;
    }
  }

  text = text
    .replace(KEYCAP, '')
    .replace(PICTOGRAPHIC, '')
    .replace(DECORATIVE, '');

  text = replaceDashes(text, language === 'Arabic' ? '، ' : ', ');

  return (
    text
      // A comma inherited from a dash that already sat next to punctuation.
      .replace(/،\s*([،.!؟:])/g, '$1')
      .replace(/,\s*([,.!?:])/g, '$1')
      // Gaps left where an emoji was lifted out, without touching indentation.
      .replace(/(?<=\S) {2,}/g, ' ')
      .replace(/[ \t]+$/gm, '')
      // Bullets and headings whose only content was the icon.
      .replace(/^[ \t]*(?:[-*+]|#{1,6}|\d+[.)])[ \t]*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}
