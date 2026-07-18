import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateTenantStatusDto {
  @IsIn(['ACTIVE', 'REJECTED', 'PENDING'])
  status: 'ACTIVE' | 'REJECTED' | 'PENDING';

  @IsOptional()
  @IsString()
  reason?: string;
}
