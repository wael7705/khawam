import { prisma } from '../../config/database.js';

export async function runDailyArchive(): Promise<void> {
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
    console.log(`[queue] daily archive: moved ${result.count} orders`);
  }
}

export async function runMonthlyArchive(): Promise<void> {
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
    console.log(`[queue] monthly archive: moved ${result.count} orders`);
  }
}

export async function runFileCleanup(): Promise<void> {
  const { readdir, stat, unlink } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const { config } = await import('../../config/index.js');

  const tempDir = join(config.uploadDir, 'order-temp');
  const maxAge = 15 * 24 * 60 * 60 * 1000;

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
      console.log(`[queue] file cleanup: removed ${cleaned} temp files`);
    }
  } catch {
    // مجلد مؤقت قد لا يكون موجوداً بعد
  }
}
