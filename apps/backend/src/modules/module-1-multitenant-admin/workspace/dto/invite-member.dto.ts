import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsIn(['ADMIN', 'COLLABORATOR'])
  role!: 'ADMIN' | 'COLLABORATOR';

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}
