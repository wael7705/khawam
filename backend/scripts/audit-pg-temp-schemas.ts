/**
 * Audit pg_temp_* / pg_toast_temp_* schemas and active backends.
 * These are PostgreSQL session temps — not application schemas.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type CountRow = { kind: string; count: bigint | number };
type BackendRow = {
  pid: number;
  usename: string | null;
  application_name: string | null;
  client_addr: string | null;
  state: string | null;
  state_change: Date | null;
  backend_start: Date;
  query_start: Date | null;
  wait_event_type: string | null;
  temp_schemas: bigint | number;
};

async function main(): Promise<void> {
  const counts = await prisma.$queryRaw<CountRow[]>`
    SELECT
      CASE
        WHEN schema_name LIKE 'pg_temp_%' THEN 'pg_temp'
        WHEN schema_name LIKE 'pg_toast_temp_%' THEN 'pg_toast_temp'
        ELSE 'other'
      END AS kind,
      COUNT(*)::bigint AS count
    FROM information_schema.schemata
    WHERE schema_name LIKE 'pg_temp_%'
       OR schema_name LIKE 'pg_toast_temp_%'
    GROUP BY 1
    ORDER BY 1
  `;

  console.log('=== Temporary schema counts ===');
  for (const row of counts) {
    console.log(`  ${row.kind}: ${row.count}`);
  }

  const backends = await prisma.$queryRaw<BackendRow[]>`
    SELECT
      s.pid,
      s.usename,
      s.application_name,
      s.client_addr::text,
      s.state,
      s.state_change,
      s.backend_start,
      s.query_start,
      s.wait_event_type,
      (
        SELECT COUNT(*)::bigint
        FROM pg_namespace n
        WHERE n.nspname LIKE 'pg_temp_' || s.pid::text
           OR n.nspname LIKE 'pg_toast_temp_' || s.pid::text
      ) AS temp_schemas
    FROM pg_stat_activity s
    WHERE s.datname = current_database()
      AND s.pid <> pg_backend_pid()
    ORDER BY s.backend_start ASC
  `;

  console.log('\n=== Active backends (excluding this audit session) ===');
  console.log(`  total: ${backends.length}`);
  const byState = new Map<string, number>();
  for (const b of backends) {
    const key = b.state ?? 'unknown';
    byState.set(key, (byState.get(key) ?? 0) + 1);
  }
  for (const [state, n] of byState) {
    console.log(`  ${state}: ${n}`);
  }

  const staleIdle = backends.filter((b) => {
    if (b.state !== 'idle') return false;
    if (!b.state_change) return false;
    const idleMs = Date.now() - new Date(b.state_change).getTime();
    return idleMs > 30 * 60 * 1000;
  });

  console.log(`\n  idle > 30 min: ${staleIdle.length}`);

  if (staleIdle.length > 0) {
    console.log('\n=== Sample stale idle backends ===');
    for (const b of staleIdle.slice(0, 15)) {
      console.log(
        `  pid=${b.pid} app=${b.application_name ?? '-'} client=${b.client_addr ?? '-'} since=${b.state_change?.toISOString() ?? '-'}`,
      );
    }
  }

  await prisma.$disconnect();
}

main().catch(async (err: unknown) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
