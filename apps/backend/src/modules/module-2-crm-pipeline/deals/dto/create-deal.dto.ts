import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { DealStatus } from '../../../../../generated/prisma/client';

export class CreateDealDto {
  @IsString()
  contactId!: string;

  @IsString()
  title!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsEnum(DealStatus)
  status?: DealStatus;
}
