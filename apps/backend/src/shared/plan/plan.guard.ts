import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlanType } from '../../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { REQUIRED_PLAN_KEY } from './require-plan.decorator';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan = this.reflector.getAllAndOverride<PlanType>(REQUIRED_PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPlan) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user?.tenantId) {
      throw new ForbiddenException('Fonctionnalite reservee a un workspace.');
    }

    const tenant = await this.prisma.raw.tenant.findUnique({
      where: { id: user.tenantId },
      select: { plan: true },
    });

    if (tenant?.plan !== requiredPlan) {
      throw new ForbiddenException(
        `Cette fonctionnalite necessite le plan ${requiredPlan}. Passez a l'offre superieure pour y acceder.`,
      );
    }

    return true;
  }
}
