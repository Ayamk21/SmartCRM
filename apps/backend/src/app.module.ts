import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/prisma/prisma.module';
import { TenantModule } from './shared/tenant/tenant.module';
import { TenantContextInterceptor } from './shared/tenant/tenant-context.interceptor';
import { AuthModule } from './modules/module-1-multitenant-admin/auth/auth.module';
import { WorkspaceModule } from './modules/module-1-multitenant-admin/workspace/workspace.module';
import { AdminModule } from './modules/module-1-multitenant-admin/admin/admin.module';
import { SubscriptionModule } from './modules/module-1-multitenant-admin/subscription/subscription.module';
import { ContactsModule } from './modules/module-2-crm-pipeline/contacts/contacts.module';
import { DealsModule } from './modules/module-2-crm-pipeline/deals/deals.module';
import { ActivitiesModule } from './modules/module-2-crm-pipeline/activities/activities.module';
import { QuoteGeneratorModule } from './modules/module-3-copilot-ia/quote-generator/quote-generator.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TenantModule,
    PrismaModule,
    AuthModule,
    WorkspaceModule,
    AdminModule,
    SubscriptionModule,
    ContactsModule,
    DealsModule,
    ActivitiesModule,
    QuoteGeneratorModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
export class AppModule {}
