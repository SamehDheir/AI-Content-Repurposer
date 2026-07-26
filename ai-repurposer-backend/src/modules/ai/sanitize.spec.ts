import { stripAiTells } from './sanitize';

describe('stripAiTells', () => {
  describe('icons and symbols', () => {
    it('removes emoji but keeps the words around them', () => {
      expect(stripAiTells('🚀 Big news today 🎉', 'English')).toBe(
        'Big news today',
      );
    });

    it('removes emoji from inside Arabic text without touching the script', () => {
      expect(stripAiTells('ده الموضوع اللي هيغير شغلك 🔥 جربه')).toBe(
        'ده الموضوع اللي هيغير شغلك جربه',
      );
    });

    it('removes multi-codepoint emoji whole, leaving no joiners behind', () => {
      // ZWJ family sequence, skin-tone modifier, and a flag.
      const out = stripAiTells('a 👩‍👩‍👧 b 👍🏽 c 🇪🇬 d', 'English');
      expect(out).toBe('a b c d');
      // Alternation, not a class: these are the combined characters that
      // `no-misleading-character-class` rejects inside one.
      expect(/‍|️|︎/.test(out)).toBe(false);
    });

    it('removes keycaps without orphaning the digit', () => {
      expect(stripAiTells('1️⃣ First point', 'English')).toBe('First point');
    });

    it('removes checkmarks and bullet dingbats used as badges', () => {
      expect(stripAiTells('✅ Done ★ and ➤ next', 'English')).toBe(
        'Done and next',
      );
    });

    it('keeps Arabic punctuation and ordinary symbols', () => {
      expect(stripAiTells('كام واحد؟ 50% منهم، صح؛ تمام')).toBe(
        'كام واحد؟ 50% منهم، صح؛ تمام',
      );
    });
  });

  describe('em dashes', () => {
    it('replaces a spaced em dash with a comma', () => {
      expect(stripAiTells('It works — really well', 'English')).toBe(
        'It works, really well',
      );
    });

    it('uses the Arabic comma for Arabic output', () => {
      expect(stripAiTells('الفكرة بسيطة — بس محدش بيعملها')).toBe(
        'الفكرة بسيطة، بس محدش بيعملها',
      );
    });

    it('leaves a numeric range alone', () => {
      expect(stripAiTells('Between 2020–2024 it doubled', 'English')).toBe(
        'Between 2020–2024 it doubled',
      );
    });

    it('does not double up punctuation', () => {
      expect(stripAiTells('Wait — , then go', 'English')).toBe('Wait, then go');
    });
  });

  describe('preambles', () => {
    it('drops a chat-style opener', () => {
      expect(
        stripAiTells(
          "Sure! Here's your Twitter thread:\n\nReal first line",
          'English',
        ),
      ).toBe('Real first line');
    });

    it('drops an Arabic opener', () => {
      expect(stripAiTells('بالتأكيد، إليك المنشور:\n\nأول سطر حقيقي')).toBe(
        'أول سطر حقيقي',
      );
    });

    it('unwraps a code fence around the whole answer', () => {
      expect(stripAiTells('```markdown\n# Title\n\nBody\n```', 'English')).toBe(
        '# Title\n\nBody',
      );
    });

    it('keeps a first line that only looks like a preamble', () => {
      const text =
        'Here is the part everyone skips, and it costs them.\n\nBody';
      expect(stripAiTells(text, 'English')).toBe(text);
    });
  });

  describe('whitespace repair', () => {
    it('preserves markdown indentation while closing emoji gaps', () => {
      expect(stripAiTells('- item\n  - 🚀 nested  gap', 'English')).toBe(
        '- item\n  - nested gap',
      );
    });

    it('drops a bullet whose only content was an icon', () => {
      expect(stripAiTells('- real\n- 🎯\n- also real', 'English')).toBe(
        '- real\n\n- also real',
      );
    });

    it('collapses the blank lines that removal leaves behind', () => {
      expect(stripAiTells('a\n\n\n\n\nb', 'English')).toBe('a\n\nb');
    });

    it('returns an empty string for empty input', () => {
      expect(stripAiTells('', 'English')).toBe('');
    });
  });
});
