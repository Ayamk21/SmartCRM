import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import type { Prisma, DealStatus } from '../../../../generated/prisma/client';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

const STATUS_LABEL: Record<DealStatus, string> = {
  PROSPECT: 'Prospect',
  QUALIFICATION: 'Qualification',
  PROPOSITION: 'Proposition envoyée',
  GAGNE: 'Gagné',
  PERDU: 'Perdu',
};

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDealDto) {
    const contact = await this.prisma.db.contact.findUnique({
      where: { id: dto.contactId },
    });
    if (!contact) {
      throw new NotFoundException('Contact introuvable.');
    }
    return this.prisma.db.deal.create({
      data: dto as Prisma.DealUncheckedCreateInput,
    });
  }

  findAll() {
    return this.prisma.db.deal.findMany({
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const deal = await this.prisma.db.deal.findUnique({
      where: { id },
      include: { contact: true },
    });
    if (!deal) {
      throw new NotFoundException('Opportunité introuvable.');
    }
    return deal;
  }

  async update(id: string, dto: UpdateDealDto, userId: string) {
    const previous = await this.findOne(id);
    const updated = await this.prisma.db.deal.update({
      where: { id },
      data: dto as Prisma.DealUncheckedUpdateInput,
      include: { contact: true },
    });

    if (dto.status && dto.status !== previous.status) {
      await this.prisma.db.activity.create({
        data: {
          type: 'STATUS_CHANGE',
          content: `Statut changé : ${STATUS_LABEL[previous.status]} → ${STATUS_LABEL[dto.status]}`,
          contactId: updated.contactId,
          createdByUserId: userId,
        } as Prisma.ActivityUncheckedCreateInput,
      });
    }

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.db.deal.delete({ where: { id } });
  }
}
