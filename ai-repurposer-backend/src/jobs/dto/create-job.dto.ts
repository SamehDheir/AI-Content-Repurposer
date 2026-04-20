import { IsNotEmpty, IsUrl } from "class-validator";

export class CreateJobDto {
  @IsNotEmpty()
  @IsUrl({}, { message: 'videoUrl must be a valid URL' })
  declare videoUrl: string;
}