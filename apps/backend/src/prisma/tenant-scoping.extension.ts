import { Prisma } from '../../generated/prisma/client';
import { TenantContextService } from '../tenant/tenant-context.service';

/**
 * Liste blanche des modeles Prisma qui portent une colonne tenantId.
 * A completer au fur et a mesure (Contact, Deal, Quote, Invoice...).
 * Le modele Tenant lui-meme n'y figure jamais : c'est lui qui EST le tenant.
 */
const TENANT_SCOPED_MODELS = new Set(['User']);

const READ_OR_DELETE_OPS = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
]);

/**
 * Extension Prisma qui injecte automatiquement `tenantId` dans le `where`
 * (lectures/mises a jour/suppressions) et dans le `data` (creations) de
 * toute requete visant un modele de TENANT_SCOPED_MODELS. Le tenantId vient
 * du TenantContextService (donc de TenantContextService.run(...)) : si aucun
 * contexte n'est actif, l'operation echoue au lieu de s'executer sans filtre.
 */
export function tenantScopingExtension(tenantContext: TenantContextService) {
  return Prisma.defineExtension((client) =>
    client.$extends({
      name: 'tenant-scoping',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (!TENANT_SCOPED_MODELS.has(model)) {
              return query(args);
            }

            const tenantId = tenantContext.getTenantId();
            const a = args as Record<string, any>;

            if (READ_OR_DELETE_OPS.has(operation)) {
              a.where = { ...a.where, tenantId };
            } else if (operation === 'create') {
              a.data = { ...a.data, tenantId };
            } else if (operation === 'createMany') {
              a.data = Array.isArray(a.data)
                ? a.data.map((item: Record<string, any>) => ({ ...item, tenantId }))
                : a.data;
            } else if (operation === 'upsert') {
              a.where = { ...a.where, tenantId };
              a.create = { ...a.create, tenantId };
            }

            return query(a);
          },
        },
      },
    }),
  );
}
