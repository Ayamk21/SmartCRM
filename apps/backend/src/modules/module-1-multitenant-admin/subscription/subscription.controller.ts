import { Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SubscriptionService } from './subscription.service';

@Controller('workspace/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Roles('ADMIN')
  @Post('checkout')
  createCheckout(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionService.createCheckoutSession(user.tenantId!, user.sub);
  }

  @Roles('ADMIN')
  @Post('portal')
  createPortal(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionService.createBillingPortalSession(user.tenantId!);
  }
}
