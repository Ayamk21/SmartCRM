import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ActivityType } from '../../../../../generated/prisma/client';

export class CreateActivityDto {
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @IsString()
  content!: string;
}
