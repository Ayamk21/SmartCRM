import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marque une route comme accessible sans authentification (ex: /auth/login,
 * /auth/signup). Par defaut, toute route de l'API exige un JWT valide.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
