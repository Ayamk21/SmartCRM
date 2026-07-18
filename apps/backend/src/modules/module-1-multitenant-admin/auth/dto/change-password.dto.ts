import { IsString, Matches } from 'class-validator';
import { PASSWORD_POLICY_REGEX, PASSWORD_POLICY_MESSAGE } from '../password-policy';

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @Matches(PASSWORD_POLICY_REGEX, { message: PASSWORD_POLICY_MESSAGE })
  newPassword!: string;
}
