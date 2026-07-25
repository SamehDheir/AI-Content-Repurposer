import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  declare email: string;
}
