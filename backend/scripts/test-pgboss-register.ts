import { PgBoss } from 'pg-boss';
import { QUEUE_NAMES, QUEUE_SCHEDULES } from '../src/queue/queue.constants.js';

async function register(instance: PgBoss): Promise<void> {
  for (const { name } of QUEUE_SCHEDULES) {
    await instance.createQueue(name);
  }
  await instance.work(QUEUE_NAMES.DAILY_ARCHIVE, async () => undefined);
  await instance.work(QUEUE_NAMES.MONTHLY_ARCHIVE, async () => undefined);
  await instance.work(QUEUE_NAMES.FILE_CLEANUP, async () => undefined);
  for (const { name, cron } of QUEUE_SCHEDULES) {
    await instance.schedule(name, cron);
  }
}

async function main(): Promise<void> {
  const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL missing');

  const boss = new PgBoss({ connectionString: url, max: 2 });
  await boss.start();
  console.log('pass 1');
  await register(boss);
  await boss.stop({ graceful: true, timeout: 5000 });

  const boss2 = new PgBoss({ connectionString: url, max: 2 });
  await boss2.start();
  console.log('pass 2');
  await register(boss2);
  await boss2.stop({ graceful: true, timeout: 5000 });
  console.log('double start ok');
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
