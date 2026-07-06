import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { TenantContextService } from '../tenant/tenant-context.service';
import { tenantScopingExtension } from './tenant-scoping.extension';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  /** Client Prisma brut, non filtre : reserve au modele Tenant et a l'auth
   * (recherche d'un user par email avant de connaitre son tenant). */
  public readonly raw: PrismaClient;

  /** Client Prisma filtre automatiquement par tenant courant (cf.
   * TenantContextService) : a utiliser pour tout modele "metier" (User,
   * puis Contact/Deal/Quote... dans les phases suivantes). */
  public readonly db: ReturnType<PrismaClient['$extends']>;

  constructor(
    configService: ConfigService,
    tenantContext: TenantContextService,
  ) {
    const adapter = new PrismaPg({
      connectionString: configService.get<string>('DATABASE_URL'),
    });
    this.raw = new PrismaClient({ adapter });
    this.db = this.raw.$extends(tenantScopingExtension(tenantContext));
  }

  async onModuleInit() {
    await this.raw.$connect();
  }

  async onModuleDestroy() {
    await this.raw.$disconnect();
  }
}
