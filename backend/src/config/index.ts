import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SECRET_KEY: z.string().min(8).default('dev-secret-key-change-me'),
  PORT: z.coerce.number().default(8000),
  PUBLIC_BASE_URL: z.string().default('http://localhost:8000'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  REMOVE_BG_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USERNAME: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_USE_TLS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();
export type Config = z.infer<typeof envSchema>;
