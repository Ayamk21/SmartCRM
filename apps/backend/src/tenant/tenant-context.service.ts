import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Porte le tenantId "courant" pendant toute la duree d'une requete/operation,
 * sans avoir a le faire transiter manuellement de fonction en fonction.
 * S'appuie sur AsyncLocalStorage (natif Node.js), qui suit le contexte a
 * travers tout le code asynchrone (await, promesses...).
 */
@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<{ tenantId: string }>();

  /**
   * IMPORTANT : le callback est toujours execute via un `await` interne (et
   * non pas simplement retourne) car les promesses de Prisma sont "paresseuses"
   * (leur execution reelle ne demarre qu'au moment ou on les "attend"). Sans
   * cet await interne, AsyncLocalStorage perdrait le contexte tenant avant que
   * Prisma n'execute reellement la requete, et l'extension d'isolation
   * (tenant-scoping.extension.ts) ne verrait plus aucun tenantId.
   */
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
