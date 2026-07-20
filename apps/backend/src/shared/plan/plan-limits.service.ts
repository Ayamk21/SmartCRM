import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';

export const FREE_PLAN_LIMITS = {
  contacts: 10,
  quotes: 20,
  members: 1,
};

@Injectable()
export class PlanLimitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private async getPlan() {
    const tenantId = this.tenantContext.getTenantId();
    const tenant = await this.prisma.raw.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    return tenant.plan;
  }

  async assertContactLimit(): Promise<void> {
    if ((await this.getPlan()) !== 'FREE') return;
    const count = await this.prisma.db.contact.count();
    if (count >= FREE_PLAN_LIMITS.contacts) {
      throw new ForbiddenException(
        `Le plan Free est limite a ${FREE_PLAN_LIMITS.contacts} contacts. Passe en Pro pour un usage illimite.`,
      );
    }
  }

  async assertQuoteLimit(): Promise<void> {
    if ((await this.getPlan()) !== 'FREE') return;
    const count = await this.prisma.db.quote.count();
    if (count >= FREE_PLAN_LIMITS.quotes) {
      throw new ForbiddenException(
        `Le plan Free est limite a ${FREE_PLAN_LIMITS.quotes} devis. Passe en Pro pour un usage illimite.`,
      );
    }
  }

  async assertTeamLimit(): Promise<void> {
    if ((await this.getPlan()) !== 'FREE') return;
    const tenantId = this.tenantContext.getTenantId();
    const count = await this.prisma.raw.user.count({ where: { tenantId } });
    if (count >= FREE_PLAN_LIMITS.members) {
      throw new ForbiddenException(
        'Le plan Free est limite a 1 membre. Passe en Pro pour inviter des collaborateurs.',
      );
    }
  }
}
