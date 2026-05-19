import 'dotenv/config'
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// 1. Create a native pg connection pool
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

// 2. Instantiate the PrismaPg driver adapter
const adapter = new PrismaPg(pool);

// 3. Construct the PrismaClient with the adapter
export const prisma = new PrismaClient({ adapter });