import { IsNumber, IsPositive, IsString } from 'class-validator';

export class QuoteLineDto {
  @IsString()
  description!: string;

  @IsNumber()
  @IsPositive()
  quantity!: number;

  @IsNumber()
  @IsPositive()
  unitPrice!: number;
}
