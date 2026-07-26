import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { COUNTRY_CODES } from '@/common/config/dialects.config';

const CONTENT_TYPES = [
  'TWITTER_THREAD',
  'BLOG_POST',
  'FACEBOOK_POST',
  'HIGHLIGHTS',
];

export class GenerateImageDto {
  // Either `prompt` alone, or `content` + `contentType` together.
  @ValidateIf((o: GenerateImageDto) => !o.content)
  @IsString()
  @IsNotEmpty({ message: 'prompt is required when content is not provided' })
  @MaxLength(2000)
  prompt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  content?: string;

  @ValidateIf((o: GenerateImageDto) => !!o.content)
  @IsIn(CONTENT_TYPES, {
    message: `contentType must be one of: ${CONTENT_TYPES.join(', ')}`,
  })
  contentType?: string;

  /** Sets the scene somewhere the audience would recognise. Optional. */
  @IsOptional()
  @IsIn(COUNTRY_CODES, {
    message: `country must be one of: ${COUNTRY_CODES.join(', ')}`,
  })
  country?: string;
}
