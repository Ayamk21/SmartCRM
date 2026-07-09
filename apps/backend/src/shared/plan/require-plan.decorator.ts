import { SetMetadata } from '@nestjs/common';
import { PlanType } from '../../../generated/prisma/client';

export const REQUIRED_PLAN_KEY = 'requiredPlan';

export const RequirePlan = (plan: PlanType) => SetMetadata(REQUIRED_PLAN_KEY, plan);
