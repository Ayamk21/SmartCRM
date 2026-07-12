import { Prisma } from '../../../generated/prisma/client';
import { TenantContextService } from '../tenant/tenant-context.service';

const TENANT_SCOPED_MODELS = new Set(['User', 'Contact', 'Deal', 'Activity']);

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
