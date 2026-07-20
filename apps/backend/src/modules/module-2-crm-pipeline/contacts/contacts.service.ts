import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { PlanLimitsService } from '../../../shared/plan/plan-limits.service';
import type { Prisma } from '../../../../generated/prisma/client';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
  ) {}

  async create(dto: CreateContactDto) {
    await this.planLimits.assertContactLimit();
    return this.prisma.db.contact.create({
      data: dto as Prisma.ContactUncheckedCreateInput,
    });
  }

  findAll() {
    return this.prisma.db.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.db.contact.findUnique({
      where: { id },
      include: { deals: true, activities: { orderBy: { createdAt: 'desc' } } },
    });
    if (!contact) {
      throw new NotFoundException('Contact introuvable.');
    }
    return contact;
  }

  async update(id: string, dto: UpdateContactDto) {
    await this.findOne(id);
    return this.prisma.db.contact.update({
      where: { id },
      data: dto as Prisma.ContactUncheckedUpdateInput,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.db.contact.delete({ where: { id } });
  }
}
