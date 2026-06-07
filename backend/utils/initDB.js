import { migrateLegacyRoles } from './migrateLegacyRoles.js';
import { ensureTables, ensureAdmin } from './ensureDatabase.js';

export const initDB = async (prisma) => {
  console.log('Initializing database...');
  try {
    await ensureTables(prisma);
    await migrateLegacyRoles(prisma);
    await ensureAdmin(prisma);
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};
