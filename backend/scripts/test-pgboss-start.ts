import { PgBoss } from 'pg-boss';

async function main(): Promise<void> {
  const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL missing');
  }

  const boss = new PgBoss({ connectionString: url, max: 2 });
  await boss.start();
  const installed = await boss.isInstalled();
  console.log('pg-boss started, installed=', installed);
  await boss.stop({ graceful: true, timeout: 5000 });
}

main().catch((err: unknown) => {
  console.error('pg-boss test failed:', err);
  process.exit(1);
});
