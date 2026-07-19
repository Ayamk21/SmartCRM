import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextNumber(prefix: 'DEVIS' | 'FACT') {
    const count =
      prefix === 'DEVIS'
        ? await this.prisma.db.quote.count()
        : await this.prisma.db.invoice.count();
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  async create(dto: CreateQuoteDto) {
    const contact = await this.prisma.db.contact.findUnique({ where: { id: dto.contactId } });
    if (!contact) {
      throw new NotFoundException('Contact introuvable.');
    }
    if (dto.dealId) {
      const deal = await this.prisma.db.deal.findUnique({ where: { id: dto.dealId } });
      if (!deal) {
        throw new NotFoundException('Opportunité introuvable.');
      }
    }

    const number = await this.nextNumber('DEVIS');
    return this.prisma.db.quote.create({
      data: {
        number,
        contactId: dto.contactId,
        dealId: dto.dealId,
        validUntil: dto.validUntil,
        notes: dto.notes,
        lines: { create: dto.lines },
      } as Prisma.QuoteUncheckedCreateInput,
      include: { contact: true, lines: true },
    });
  }

  findAll(contactId?: string) {
    return this.prisma.db.quote.findMany({
      where: contactId ? { contactId } : undefined,
      include: { contact: true, lines: true, invoice: true, tenant: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const quote = await this.prisma.db.quote.findUnique({
      where: { id },
      include: { contact: true, lines: true, invoice: true, tenant: true },
    });
    if (!quote) {
      throw new NotFoundException('Devis introuvable.');
    }
    return quote;
  }

  async update(id: string, dto: UpdateQuoteDto) {
    const quote = await this.findOne(id);
    if (quote.status !== 'DRAFT') {
      throw new BadRequestException('Seul un devis en brouillon peut être modifié.');
    }

    if (dto.lines) {
      await this.prisma.db.quoteLine.deleteMany({ where: { quoteId: id } });
    }

    return this.prisma.db.quote.update({
      where: { id },
      data: {
        validUntil: dto.validUntil,
        notes: dto.notes,
        ...(dto.lines ? { lines: { create: dto.lines } } : {}),
      } as Prisma.QuoteUncheckedUpdateInput,
      include: { contact: true, lines: true },
    });
  }

  async validate(id: string) {
    const quote = await this.findOne(id);
    if (quote.status !== 'DRAFT') {
      throw new BadRequestException('Seul un devis en brouillon peut être validé.');
    }
    return this.prisma.db.quote.update({
      where: { id },
      data: { status: 'VALIDATED' },
      include: { contact: true, lines: true },
    });
  }

  async convertToInvoice(id: string) {
    const quote = await this.findOne(id);
    if (quote.status !== 'VALIDATED') {
      throw new BadRequestException('Seul un devis validé peut être converti en facture.');
    }

    const number = await this.nextNumber('FACT');
    const invoice = await this.prisma.db.invoice.create({
      data: {
        number,
        contactId: quote.contactId,
        quoteId: quote.id,
        lines: {
          create: quote.lines.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
        },
      } as Prisma.InvoiceUncheckedCreateInput,
      include: { contact: true, lines: true },
    });

    await this.prisma.db.quote.update({ where: { id }, data: { status: 'CONVERTED' } });

    return invoice;
  }

  async remove(id: string) {
    const quote = await this.findOne(id);
    if (quote.status !== 'DRAFT') {
      throw new BadRequestException('Seul un devis en brouillon peut être supprimé.');
    }
    await this.prisma.db.quote.delete({ where: { id } });
  }
}
