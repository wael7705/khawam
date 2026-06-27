export const QUEUE_NAMES = {
  DAILY_ARCHIVE: 'maintenance.daily-archive',
  MONTHLY_ARCHIVE: 'maintenance.monthly-archive',
  FILE_CLEANUP: 'maintenance.file-cleanup',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const QUEUE_SCHEDULES: ReadonlyArray<{
  name: QueueName;
  cron: string;
}> = [
  { name: QUEUE_NAMES.DAILY_ARCHIVE, cron: '0 0 * * *' },
  { name: QUEUE_NAMES.MONTHLY_ARCHIVE, cron: '0 1 1 * *' },
  { name: QUEUE_NAMES.FILE_CLEANUP, cron: '0 */6 * * *' },
];
