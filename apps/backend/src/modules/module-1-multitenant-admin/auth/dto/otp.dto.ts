import { IsEmail, IsIn, IsString, Length } from 'class-validator';

export class RequestOtpDto {
  @IsEmail()
  email!: string;

  @IsIn(['EMAIL', 'SMS'])
  channel!: 'EMAIL' | 'SMS';
}

export class VerifyOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}
