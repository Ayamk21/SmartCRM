import { IsIn } from 'class-validator';

export class UpdateInvoiceStatusDto {
  @IsIn(['DRAFT', 'SENT', 'PAID'])
  status!: 'DRAFT' | 'SENT' | 'PAID';
}
