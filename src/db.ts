import { PrismaClient } from '@prisma/client';

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';

console.log(`[Database] Initializing PrismaClient with datasource URL: ${dbUrl}`);

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});
