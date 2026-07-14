import { IsString, MinLength } from 'class-validator';

export class SummarizeConversationDto {
  @IsString()
  @MinLength(20)
  text!: string;
}
