/**
 * pg_temp_* / pg_toast_temp_* are PostgreSQL per-session temporary namespaces.
 * Orphaned ones (no matching backend) can be dropped after sessions end.
 * Safe fix for many orphans: restart Postgres on Railway, or run this script.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DRY_RUN = !process.argv.includes('--execute');

type NamespaceRow = { nspname: string };

async function main(): Promise<void> {
  const orphans = await prisma.$queryRaw<NamespaceRow[]>`
    SELECT n.nspname
    FROM pg_namespace n
    WHERE (n.nspname LIKE 'pg_temp_%' OR n.nspname LIKE 'pg_toast_temp_%')
      AND NOT EXISTS (
        SELECT 1
        FROM pg_stat_activity a
        WHERE n.nspname = 'pg_temp_' || a.pid::text
           OR n.nspname = 'pg_toast_temp_' || a.pid::text
      )
    ORDER BY n.nspname
  `;

  console.log(`Orphan temp namespaces: ${orphans.length} (dry_run=${DRY_RUN})`);

  if (orphans.length === 0) {
    console.log('Nothing to clean. If you still see many in UI, restart Postgres service on Railway.');
    await prisma.$disconnect();
    return;
  }

  if (DRY_RUN) {
    console.log('Sample:', orphans.slice(0, 10).map((r) => r.nspname));
    console.log('Re-run with --execute to DROP orphaned schemas.');
    await prisma.$disconnect();
    return;
  }

  let dropped = 0;
  for (const row of orphans) {
    const name = row.nspname.replace(/"/g, '""');
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${name}" CASCADE`);
    dropped += 1;
  }

  console.log(`Dropped ${dropped} orphan temp schemas.`);

  const remaining = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM pg_namespace n
    WHERE n.nspname LIKE 'pg_temp_%' OR n.nspname LIKE 'pg_toast_temp_%'
  `;
  console.log(`Remaining temp namespaces: ${remaining[0]?.count ?? 0}`);

  await prisma.$disconnect();
}

main().catch(async (err: unknown) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
