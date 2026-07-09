import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  controllers: [SubscriptionController, StripeWebhookController],
  providers: [SubscriptionService],
})
export class SubscriptionModule {}
