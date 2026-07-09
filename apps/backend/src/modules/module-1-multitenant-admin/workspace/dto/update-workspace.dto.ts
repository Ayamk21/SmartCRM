import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  siret?: string;

  @IsOptional()
  @IsString()
  pdfTemplate?: string;
}
