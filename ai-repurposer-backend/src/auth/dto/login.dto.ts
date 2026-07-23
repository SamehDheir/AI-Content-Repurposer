import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  declare email: string;

  @IsString()
  @IsNotEmpty()
  declare password: string;
}
