import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../generated/prisma/client';
import { TenantContextService } from '../tenant/tenant-context.service';
import { tenantScopingExtension } from './tenant-scoping.extension';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public readonly raw: PrismaClient;
  public readonly db: ReturnType<PrismaService['buildDb']>;

  constructor(
    configService: ConfigService,
    tenantContext: TenantContextService,
  ) {
    const adapter = new PrismaPg({
      connectionString: configService.get<string>('DATABASE_URL'),
    });
    this.raw = new PrismaClient({ adapter });
    this.db = this.buildDb(tenantContext);
  }

  private buildDb(tenantContext: TenantContextService) {
    return this.raw.$extends(tenantScopingExtension(tenantContext));
  }

  async onModuleInit() {
    await this.raw.$connect();
  }

  async onModuleDestroy() {
    await this.raw.$disconnect();
  }
}
