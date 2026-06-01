/** Map removed DB enum values so Prisma can read all users again. */
export async function migrateLegacyRoles(prisma) {
  try {
    const updated = await prisma.$executeRaw`
      UPDATE "User"
      SET role = 'TEACHER'::"Role"
      WHERE role::text = 'PRINCIPAL'
    `;
    if (Number(updated) > 0) {
      console.log(`Migrated ${updated} user(s) from PRINCIPAL to TEACHER.`);
    }
  } catch (error) {
    // Enum value may already be gone, or no PRINCIPAL rows
    if (!String(error.message).includes('PRINCIPAL')) {
      console.warn('Legacy role migration skipped:', error.message);
    }
  }
}
