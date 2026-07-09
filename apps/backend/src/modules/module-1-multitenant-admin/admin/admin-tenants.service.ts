import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';

@Injectable()
export class AdminTenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTenants() {
    const tenants = await this.prisma.raw.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          where: { role: 'ADMIN' },
          take: 1,
          select: { email: true },
        },
      },
    });

    return tenants.map((t) => ({
      id: t.id,
      name: t.name,
      status: t.status,
      plan: t.plan,
      createdAt: t.createdAt,
      adminEmail: t.users[0]?.email ?? null,
    }));
  }

  async updateStatus(tenantId: string, dto: UpdateTenantStatusDto) {
    const tenant = await this.prisma.raw.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant introuvable.');
    }
    return this.prisma.raw.tenant.update({
      where: { id: tenantId },
      data: { status: dto.status },
    });
  }
}
