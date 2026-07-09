import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user?.isPlatformAdmin) {
      throw new ForbiddenException('Reserve aux administrateurs de la plateforme.');
    }
    return true;
  }
}
