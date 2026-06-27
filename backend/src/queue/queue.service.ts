import { PgBoss } from 'pg-boss';
import { config } from '../config/index.js';
import {
  runDailyArchive,
  runFileCleanup,
  runMonthlyArchive,
} from './handlers/maintenance.handler.js';
import { QUEUE_NAMES, QUEUE_SCHEDULES } from './queue.constants.js';

let boss: PgBoss | null = null;

async function registerWorkers(instance: PgBoss): Promise<void> {
  for (const { name } of QUEUE_SCHEDULES) {
    await instance.createQueue(name);
  }

  await instance.work(QUEUE_NAMES.DAILY_ARCHIVE, async () => {
    await runDailyArchive();
  });

  await instance.work(QUEUE_NAMES.MONTHLY_ARCHIVE, async () => {
    await runMonthlyArchive();
  });

  await instance.work(QUEUE_NAMES.FILE_CLEANUP, async () => {
    await runFileCleanup();
  });
}

async function registerSchedules(instance: PgBoss): Promise<void> {
  for (const { name, cron } of QUEUE_SCHEDULES) {
    await instance.schedule(name, cron);
  }
}

export async function startQueue(): Promise<void> {
  if (boss) return;

  const instance = new PgBoss({
    connectionString: config.directDatabaseUrl,
    max: config.QUEUE_POOL_MAX,
    application_name: 'khawam-queue',
  });

  instance.on('error', (error: Error) => {
    console.error('[queue] pg-boss error:', error);
  });

  await instance.start();
  await registerWorkers(instance);
  await registerSchedules(instance);

  boss = instance;
  console.log('[queue] pg-boss started (PostgreSQL-backed job queue)');
}

export async function stopQueue(): Promise<void> {
  if (!boss) return;
  await boss.stop({ graceful: true, timeout: 8000 });
  boss = null;
  console.log('[queue] pg-boss stopped');
}

export function isQueueRunning(): boolean {
  return boss !== null;
}

export async function enqueueJob(
  name: string,
  data: Record<string, unknown> = {},
): Promise<string | null> {
  if (!boss) {
    throw new Error('Queue is not running');
  }
  return boss.send(name, data);
}

export async function getQueueHealth(): Promise<{
  running: boolean;
  installed: boolean;
}> {
  if (!boss) {
    return { running: false, installed: false };
  }

  const installed = await boss.isInstalled();
  return { running: true, installed };
}
