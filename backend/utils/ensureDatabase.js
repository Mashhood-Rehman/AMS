import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');

/** Prisma model tables from schema.prisma */
const EXPECTED_TABLES = [
  'User',
  'Institute',
  'AcademicClass',
  'ClassSection',
  'Course',
  'Enrollment',
  'Attendance',
  'TeacherAttendance',
  'Alert',
];

export const ADMIN_EMAIL = 'admin@ams.com';
export const ADMIN_PASSWORD = 'admin123';

const ADMIN_PERMISSIONS = [
  'dashboard',
  'institutes',
  'attendance',
  'students',
  'courses',
  'classes',
  'reports',
  'settings',
  'user-logs',
];

async function getExistingTables(prisma) {
  const rows = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  `;
  return new Set(rows.map((row) => row.table_name));
}

function applyMigrations() {
  console.log('Applying Prisma migrations...');
  execSync('npx prisma migrate deploy', {
    cwd: backendRoot,
    stdio: 'inherit',
    env: process.env,
  });
  console.log('Database tables created successfully.');
}

export async function ensureTables(prisma) {
  console.log('Checking database tables...');
  const existing = await getExistingTables(prisma);
  const missing = EXPECTED_TABLES.filter((table) => !existing.has(table));

  if (missing.length === 0) {
    console.log('All database tables exist.');
    return;
  }

  console.log(`Missing tables: ${missing.join(', ')}`);
  applyMigrations();

  const after = await getExistingTables(prisma);
  const stillMissing = EXPECTED_TABLES.filter((table) => !after.has(table));
  if (stillMissing.length === 0) return;

  console.log(`Still missing after migrations: ${stillMissing.join(', ')}. Syncing schema...`);
  execSync('npx prisma db push --skip-generate', {
    cwd: backendRoot,
    stdio: 'inherit',
    env: process.env,
  });

  const final = await getExistingTables(prisma);
  const unresolved = EXPECTED_TABLES.filter((table) => !final.has(table));
  if (unresolved.length > 0) {
    throw new Error(`Could not create tables: ${unresolved.join(', ')}`);
  }
}

export async function ensureAdmin(prisma) {
  console.log('Checking for admin user...');
  const admin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (admin) {
    console.log('Admin user already exists.');
    return;
  }

  console.log('No admin user found. Creating default admin...');
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: 'System Admin',
      role: Role.ADMIN,
      permissions: ADMIN_PERMISSIONS,
    },
  });
  console.log(`Default admin created (${ADMIN_EMAIL}).`);
}
