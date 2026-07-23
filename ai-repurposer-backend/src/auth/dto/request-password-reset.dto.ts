import { IsEmail } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  declare email: string;
}
