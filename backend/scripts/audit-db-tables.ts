/**
 * Read-only audit: list PostgreSQL schemas/tables vs Prisma @@map names.
 * Usage: DATABASE_URL=... pnpm exec tsx scripts/audit-db-tables.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Tables defined in prisma/schema.prisma via @@map */
const PRISMA_TABLES = new Set([
  'user_types',
  'users',
  'accounts',
  'saved_locations',
  'product_categories',
  'products',
  'product_sizes',
  'services',
  'pricing_rules',
  'pricing_rule_ranges',
  'service_options',
  'orders',
  'order_items',
  'order_status_history',
  'payments',
  'payment_settings',
  'portfolio_works',
  'service_workflows',
  'visitor_tracking',
  'page_views',
  'studio_projects',
  'image_processing_logs',
]);

/** Prisma migration metadata — never drop */
const SYSTEM_TABLES = new Set(['_prisma_migrations']);

type SchemaRow = { schema_name: string };
type TableRow = { table_schema: string; table_name: string; row_estimate: bigint | number | null };

async function main(): Promise<void> {
  const schemas = await prisma.$queryRaw<SchemaRow[]>`
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    ORDER BY schema_name
  `;

  const tables = await prisma.$queryRaw<TableRow[]>`
    SELECT
      t.table_schema,
      t.table_name,
      c.reltuples::bigint AS row_estimate
    FROM information_schema.tables t
    JOIN pg_class c ON c.relname = t.table_name
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
    WHERE t.table_type = 'BASE TABLE'
      AND t.table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY t.table_schema, t.table_name
  `;

  const bySchema = new Map<string, TableRow[]>();
  for (const row of tables) {
    const list = bySchema.get(row.table_schema) ?? [];
    list.push(row);
    bySchema.set(row.table_schema, list);
  }

  console.log('=== PostgreSQL schemas ===');
  for (const s of schemas) {
    const count = bySchema.get(s.schema_name)?.length ?? 0;
    console.log(`  ${s.schema_name}: ${count} tables`);
  }

  const publicTables = bySchema.get('public') ?? [];
  const essential: TableRow[] = [];
  const orphan: TableRow[] = [];
  const system: TableRow[] = [];

  for (const t of publicTables) {
    if (SYSTEM_TABLES.has(t.table_name)) {
      system.push(t);
    } else if (PRISMA_TABLES.has(t.table_name)) {
      essential.push(t);
    } else {
      orphan.push(t);
    }
  }

  console.log('\n=== public schema summary ===');
  console.log(`  essential (Prisma): ${essential.length}`);
  console.log(`  system: ${system.length}`);
  console.log(`  orphan (candidate drop): ${orphan.length}`);

  console.log('\n=== Essential tables ===');
  for (const t of essential) {
    console.log(`  ${t.table_name} (~${t.row_estimate ?? 0} rows est.)`);
  }

  console.log('\n=== Orphan tables (NOT in current Prisma schema) ===');
  for (const t of orphan) {
    console.log(`  ${t.table_name} (~${t.row_estimate ?? 0} rows est.)`);
  }

  const otherSchemas = [...bySchema.entries()].filter(([name]) => name !== 'public');
  if (otherSchemas.length > 0) {
    console.log('\n=== Non-public schemas (full list) ===');
    for (const [schema, list] of otherSchemas) {
      console.log(`  [${schema}]`);
      for (const t of list) {
        console.log(`    ${t.table_name}`);
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(async (err: unknown) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
