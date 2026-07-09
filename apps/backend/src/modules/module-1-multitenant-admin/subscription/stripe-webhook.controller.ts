import { BadRequestException, Controller, Headers, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { SubscriptionService } from './subscription.service';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Public()
  @Post()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody || !signature) {
      throw new BadRequestException('Requete webhook invalide.');
    }
    const event = this.subscriptionService.constructWebhookEvent(req.rawBody, signature);
    await this.subscriptionService.handleWebhookEvent(event);
    return { received: true };
  }
}
