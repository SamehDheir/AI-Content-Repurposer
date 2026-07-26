import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { COUNTRY_CODES } from '@/common/config/dialects.config';

// The worker can only handle YouTube sources, so reject anything else at the
// boundary rather than letting it fail three retries deep in the queue.
//
// Anchored at BOTH ends. It used to end at the 11-character video id with no
// `$`, so everything after the id was unchecked — and `@IsUrl` does not help
// because validator.js strips the query and fragment before it looks. That let
// `https://youtu.be/<11 chars>$(...)` through to a shell command in
// TranscriptionService. The trailing group therefore allows only the query and
// fragment characters YouTube actually uses, with no shell metacharacters:
// no `$`, backtick, quote, `;`, `|`, `&&`, newline or backslash.
//
// TranscriptionService no longer passes this string to a subprocess at all —
// it rebuilds a canonical URL from the extracted id — but the two defences are
// deliberately independent.
const YOUTUBE_URL =
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[\w=&%.-]*&)?v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/)[\w-]{11}(?:[?&#][\w=&%.\-/]*)?$/i;

export class CreateJobDto {
  @IsNotEmpty()
  @MaxLength(256, { message: 'videoUrl is too long' })
  @IsUrl({}, { message: 'videoUrl must be a valid URL' })
  @Matches(YOUTUBE_URL, { message: 'videoUrl must be a YouTube video URL' })
  declare videoUrl: string;

  @IsOptional()
  @IsIn(['Arabic', 'English'], {
    message: 'language must be either Arabic or English',
  })
  language?: 'Arabic' | 'English' = 'Arabic';

  /**
   * Which country's spoken Arabic to write in. Omitted means Modern Standard
   * Arabic, which is what every job did before this existed. Ignored when the
   * language is English.
   */
  @IsOptional()
  @IsIn(COUNTRY_CODES, {
    message: `country must be one of: ${COUNTRY_CODES.join(', ')}`,
  })
  country?: string;
}
