import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.db.invoice.findMany({
      include: { contact: true, lines: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.db.invoice.findUnique({
      where: { id },
      include: { contact: true, lines: true, tenant: true },
    });
    if (!invoice) {
      throw new NotFoundException('Facture introuvable.');
    }
    return invoice;
  }

  async updateStatus(id: string, dto: UpdateInvoiceStatusDto) {
    await this.findOne(id);
    return this.prisma.db.invoice.update({
      where: { id },
      data: { status: dto.status },
      include: { contact: true, lines: true },
    });
  }
}
