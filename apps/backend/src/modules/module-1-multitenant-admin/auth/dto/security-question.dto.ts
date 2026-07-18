import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SecurityQuestionAnswerDto {
  @IsString()
  question!: string;

  @IsString()
  answer!: string;
}

export class SetSecurityQuestionsDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => SecurityQuestionAnswerDto)
  questions!: SecurityQuestionAnswerDto[];
}

export class VerifySecurityAnswersDto {
  @IsEmail()
  email!: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => SecurityQuestionAnswerDto)
  answers!: SecurityQuestionAnswerDto[];
}
