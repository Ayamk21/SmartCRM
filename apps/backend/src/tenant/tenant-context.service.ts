import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<{ tenantId: string }>();

  run<T>(tenantId: string, callback: () => T | Promise<T>): Promise<T> {
    return this.storage.run({ tenantId }, async () => callback());
  }

  getTenantId(): string {
    const store = this.storage.getStore();
    if (!store) {
      throw new Error(
        'Aucun tenant actif : cette operation doit etre executee via TenantContextService.run(tenantId, ...)',
      );
    }
    return store.tenantId;
  }

  getTenantIdOrNull(): string | null {
    return this.storage.getStore()?.tenantId ?? null;
  }
}
