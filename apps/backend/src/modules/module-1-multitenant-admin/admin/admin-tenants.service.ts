import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EmailService } from '../../../shared/email/email.service';
import { generateTempPassword } from '../auth/password-policy';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';

@Injectable()
export class AdminTenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

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
      category: t.category,
      status: t.status,
      plan: t.plan,
      createdAt: t.createdAt,
      rejectionReason: t.rejectionReason,
      adminEmail: t.users[0]?.email ?? null,
    }));
  }

  async updateStatus(tenantId: string, dto: UpdateTenantStatusDto) {
    const tenant = await this.prisma.raw.tenant.findUnique({
      where: { id: tenantId },
      include: { users: { where: { role: 'ADMIN' }, take: 1 } },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant introuvable.');
    }
    const adminUser = tenant.users[0];

    if (dto.status === 'REJECTED') {
      if (!dto.reason) {
        throw new BadRequestException('Un motif de refus est requis.');
      }
      const updated = await this.prisma.raw.tenant.update({
        where: { id: tenantId },
        data: { status: 'REJECTED', rejectionReason: dto.reason },
      });
      if (adminUser) {
        await this.emailService.sendAccountRejectedEmail(adminUser.email, tenant.name, dto.reason);
      }
      return updated;
    }

    if (dto.status === 'ACTIVE' && tenant.status !== 'ACTIVE') {
      const tempPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      const updated = await this.prisma.raw.tenant.update({
        where: { id: tenantId },
        data: { status: 'ACTIVE', rejectionReason: null },
      });
      if (adminUser) {
        await this.prisma.raw.user.update({
          where: { id: adminUser.id },
          data: { password: passwordHash, mustChangePassword: true },
        });
        await this.emailService.sendAccountApprovedEmail(
          adminUser.email,
          tenant.name,
          tempPassword,
        );
      }
      return { ...updated, tempPassword };
    }

    return this.prisma.raw.tenant.update({
      where: { id: tenantId },
      data: { status: dto.status },
    });
  }
}
