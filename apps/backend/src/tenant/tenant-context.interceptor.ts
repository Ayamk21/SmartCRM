import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { from, firstValueFrom, Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';

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
