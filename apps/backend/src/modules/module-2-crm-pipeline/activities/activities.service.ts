import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(contactId: string, dto: CreateActivityDto, createdByUserId: string) {
    const contact = await this.prisma.db.contact.findUnique({
      where: { id: contactId },
    });
    if (!contact) {
      throw new NotFoundException('Contact introuvable.');
    }
    return this.prisma.db.activity.create({
      data: {
        ...dto,
        contactId,
        createdByUserId,
      } as Prisma.ActivityUncheckedCreateInput,
    });
  }
}
