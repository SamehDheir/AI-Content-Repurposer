import { IsIn, IsNotEmpty, IsOptional, IsUrl, Matches } from 'class-validator';

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
}
