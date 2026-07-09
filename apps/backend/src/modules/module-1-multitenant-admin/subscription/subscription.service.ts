import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  private readonly stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY') ?? '');
  }

  async createCheckoutSession(tenantId: string, userId: string) {
    const user = await this.prisma.raw.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        { price: this.config.get<string>('STRIPE_PRICE_ID_PRO'), quantity: 1 },
      ],
      success_url: `${frontendUrl}/workspace?upgrade=success`,
      cancel_url: `${frontendUrl}/workspace?upgrade=cancelled`,
      customer_email: user.email,
      client_reference_id: tenantId,
      metadata: { tenantId },
    });

    return { url: session.url };
  }

  async createBillingPortalSession(tenantId: string) {
    const tenant = await this.prisma.raw.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant?.stripeCustomerId) {
      throw new NotFoundException('Aucun abonnement Stripe associe a ce workspace.');
    }
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    const session = await this.stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${frontendUrl}/workspace`,
    });

    return { url: session.url };
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';
    return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }

  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenantId ?? session.client_reference_id;
        if (tenantId) {
          await this.prisma.raw.tenant.update({
            where: { id: tenantId },
            data: {
              plan: 'PRO',
              stripeCustomerId:
                typeof session.customer === 'string' ? session.customer : session.customer?.id,
              stripeSubscriptionId:
                typeof session.subscription === 'string'
                  ? session.subscription
                  : session.subscription?.id,
            },
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.prisma.raw.tenant.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { plan: 'FREE' },
        });
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const isCancelled =
          subscription.cancel_at_period_end ||
          Boolean(subscription.cancel_at) ||
          Boolean(subscription.canceled_at) ||
          subscription.status === 'canceled';
        if (isCancelled) {
          await this.prisma.raw.tenant.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: { plan: 'FREE' },
          });
        }
        break;
      }
    }
  }
}
