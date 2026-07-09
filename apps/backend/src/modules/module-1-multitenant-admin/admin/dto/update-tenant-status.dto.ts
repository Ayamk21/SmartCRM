import { IsIn } from 'class-validator';

export class UpdateTenantStatusDto {
  @IsIn(['ACTIVE', 'REJECTED', 'PENDING'])
  status: 'ACTIVE' | 'REJECTED' | 'PENDING';
}
