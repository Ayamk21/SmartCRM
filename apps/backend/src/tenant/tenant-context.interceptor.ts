import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { from, firstValueFrom, Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';

/**
 * Pour toute requete authentifiee (request.user renseigne par JwtAuthGuard),
 * execute le reste de la requete a l'interieur de
 * TenantContextService.run(tenantId, ...), pour que l'extension Prisma
 * d'isolation (tenant-scoping.extension.ts) sache pour quel tenant filtrer.
 * Les routes publiques (signup/login/refresh, pas de request.user) passent
 * simplement sans contexte tenant.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      return next.handle();
    }

    return from(this.tenantContext.run(tenantId, () => firstValueFrom(next.handle())));
  }
}
