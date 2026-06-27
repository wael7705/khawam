import { z } from 'zod';
import { join, resolve } from 'node:path';
import { buildAppDatabaseUrl } from './database-url.js';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  /** اتصال مباشر بـ Postgres (مهاجرات، seed، pg-boss). يُستخدم DATABASE_URL إن لم يُضبط. */
  DIRECT_DATABASE_URL: z.string().min(1).optional(),
  /** true عند التوجيه عبر PgBouncer (يضيف pgbouncer=true لـ Prisma). */
  PGBOUNCER_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  /** حد اتصالات Prisma لكل نسخة تطبيق (مع PgBouncer يُفضّل 5–10). */
  DB_CONNECTION_LIMIT: z.coerce.number().int().min(1).max(100).default(10),
  /** حد اتصالات pg-boss (اتصال مباشر بـ Postgres). */
  QUEUE_POOL_MAX: z.coerce.number().int().min(1).max(20).default(3),
  SECRET_KEY: z.string().min(8).default('dev-secret-key-change-me'),
  PORT: z.coerce.number().default(8000),
  PUBLIC_BASE_URL: z.string().default('http://localhost:8000'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  REMOVE_BG_API_KEY: z.string().optional(),
  UPLOAD_DIR: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USERNAME: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_USE_TLS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),
  LOVABLE_API_KEY: z.string().optional(),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }

  const data = result.data;
  // على Railway الملفات المؤقتة تُفقد عند إعادة النشر؛ استخدم Volume أو UPLOAD_DIR
  const railwayVolume = process.env.RAILWAY_VOLUME_MOUNT_PATH;
  const uploadDir = data.UPLOAD_DIR
    ? resolve(data.UPLOAD_DIR)
    : railwayVolume
      ? join(railwayVolume, 'uploads')
      : join(process.cwd(), 'uploads');
  const directDatabaseUrl = data.DIRECT_DATABASE_URL ?? data.DATABASE_URL;
  const databaseUrl = buildAppDatabaseUrl(
    data.DATABASE_URL,
    data.DB_CONNECTION_LIMIT,
    data.PGBOUNCER_ENABLED,
  );

  return {
    ...data,
    uploadDir,
    directDatabaseUrl,
    databaseUrl,
  };
}

export const config = loadConfig();
export type Config = ReturnType<typeof loadConfig>;
