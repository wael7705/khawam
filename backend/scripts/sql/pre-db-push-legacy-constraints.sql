-- Drop legacy UNIQUE constraints by name so Prisma db push can reconcile schema.
-- PostgreSQL rejects dropping backing indexes directly when owned by a constraint.
ALTER TABLE IF EXISTS "products" DROP CONSTRAINT IF EXISTS "products_sku_unique";
ALTER TABLE IF EXISTS "services" DROP CONSTRAINT IF EXISTS "services_code_unique";
ALTER TABLE IF EXISTS "service_workflows" DROP CONSTRAINT IF EXISTS "service_workflows_service_step_unique";
