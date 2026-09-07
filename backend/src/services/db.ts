import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly for local execution or nested workspaces
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const defaultDbUrl = "postgresql://neondb_owner:npg_fUebZOmt5IG8@ep-rapid-waterfall-b1zyjo75.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || defaultDbUrl,
    },
  },
});

export default prisma;

