import { IsString, MinLength } from 'class-validator';

export class GenerateQuoteDto {
  @IsString()
  @MinLength(3)
  prompt!: string;
}
