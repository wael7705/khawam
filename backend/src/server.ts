import { buildApp } from './app.js';
import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { startScheduledJobs, stopScheduledJobs } from './jobs/scheduler.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

let shuttingDown = false;

async function main(): Promise<void> {
  console.log('[server] main() started, PORT=%s', config.PORT);
  try {
    await connectDatabase();
  } catch (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }

  const app = await buildApp();
  startScheduledJobs();

  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    console.log(`Server running on http://0.0.0.0:${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  const shutdown = async (): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('Shutting down...');

    const timeoutId = setTimeout(() => {
      console.error('Shutdown timeout - forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    try {
      stopScheduledJobs();
      await app.close();
      await disconnectDatabase();
      clearTimeout(timeoutId);
      process.exit(0);
    } catch (err) {
      console.error('Shutdown error:', err);
      clearTimeout(timeoutId);
      process.exit(1);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
