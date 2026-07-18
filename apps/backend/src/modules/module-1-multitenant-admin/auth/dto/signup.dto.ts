import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  @MinLength(2)
  tenantName: string;

  @IsString()
  @MinLength(2)
  category: string;

  @IsEmail()
  email: string;
}
