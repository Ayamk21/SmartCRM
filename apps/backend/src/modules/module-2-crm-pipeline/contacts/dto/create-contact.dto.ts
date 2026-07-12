import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ContactType } from '../../../../../generated/prisma/client';

export class CreateContactDto {
  @IsOptional()
  @IsEnum(ContactType)
  type?: ContactType;

  @IsString()
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
