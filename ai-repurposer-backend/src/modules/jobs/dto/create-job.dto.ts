import { IsIn, IsNotEmpty, IsOptional, IsUrl, Matches } from 'class-validator';
import { COUNTRY_CODES } from '@/common/config/dialects.config';

// The worker can only handle YouTube sources, so reject anything else at the
// boundary rather than letting it fail three retries deep in the queue.
const YOUTUBE_URL =
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/)[\w-]{11}/i;

export class CreateJobDto {
  @IsNotEmpty()
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
