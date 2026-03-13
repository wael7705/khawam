import cron from 'node-cron';
import { prisma } from '../config/database.js';

let dailyArchiveJob: cron.ScheduledTask | null = null;
let monthlyArchiveJob: cron.ScheduledTask | null = null;
let fileCleanupJob: cron.ScheduledTask | null = null;

async function runDailyArchive(): Promise<void> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await prisma.order.updateMany({
      where: {
        status: 'completed',
        completedAt: { lt: sevenDaysAgo },
      },
      data: { status: 'archived_daily' },
    });

    if (result.count > 0) {
      console.log(`Daily archive: moved ${result.count} orders`);
    }
  } catch (error) {
    console.error('Daily archive error:', error);
  }
}

async function runMonthlyArchive(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.order.updateMany({
      where: {
        status: 'archived_daily',
        updatedAt: { lt: thirtyDaysAgo },
      },
      data: { status: 'archived_monthly' },
    });

    if (result.count > 0) {
      console.log(`Monthly archive: moved ${result.count} orders`);
    }
  } catch (error) {
    console.error('Monthly archive error:', error);
  }
}

async function runFileCleanup(): Promise<void> {
  try {
    const { readdir, stat, unlink } = await import('node:fs/promises');
    const { join } = await import('node:path');

    const { config } = await import('../config/index.js');
    const tempDir = join(config.uploadDir, 'order-temp');
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    try {
      const files = await readdir(tempDir);
      const now = Date.now();
      let cleaned = 0;

      for (const file of files) {
        const filePath = join(tempDir, file);
        const fileStat = await stat(filePath);
        if (now - fileStat.mtimeMs > maxAge) {
          await unlink(filePath);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`File cleanup: removed ${cleaned} temp files`);
      }
    } catch {
      // temp dir may not exist yet
    }
  } catch (error) {
    console.error('File cleanup error:', error);
  }
}

export function startScheduledJobs(): void {
  // Daily archive at midnight
  dailyArchiveJob = cron.schedule('0 0 * * *', () => {
    void runDailyArchive();
  });

  // Monthly archive at 1 AM
  monthlyArchiveJob = cron.schedule('0 1 1 * *', () => {
    void runMonthlyArchive();
  });

  // Temp file cleanup every 6 hours
  fileCleanupJob = cron.schedule('0 */6 * * *', () => {
    void runFileCleanup();
  });

  console.log('Scheduled jobs started');
}

export function stopScheduledJobs(): void {
  dailyArchiveJob?.stop();
  monthlyArchiveJob?.stop();
  fileCleanupJob?.stop();
  console.log('Scheduled jobs stopped');
}
