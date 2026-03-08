import { PrismaClient } from '@prisma/client';
import { config } from './index.js';

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    datasourceUrl: config.DATABASE_URL,
    log: config.NODE_ENV === 'development'
      ? ['warn', 'error']
      : ['error'],
  });

  return client;
}

export const prisma = createPrismaClient();

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('Database disconnected');
}
