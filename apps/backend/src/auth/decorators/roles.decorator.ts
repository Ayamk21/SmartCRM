import { SetMetadata } from '@nestjs/common';
import { Role } from '../../../generated/prisma/client';

export const ROLES_KEY = 'roles';

/** Restreint une route a un ou plusieurs roles (ex: @Roles('ADMIN')). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
