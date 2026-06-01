import { prisma } from '../db.js';

/** Create Class 1 … maxClass, each with a default Section A. */
export async function seedInstituteClasses(instituteId, maxClass, { tx } = {}) {
  const client = tx || prisma;
  const limit = Math.max(0, parseInt(maxClass, 10) || 0);
  if (!instituteId || limit === 0) return [];

  const created = [];
  for (let i = 1; i <= limit; i += 1) {
    const academicClass = await client.academicClass.create({
      data: {
        instituteId,
        name: `Class ${i}`,
        sortOrder: i,
        sections: {
          create: [{ name: 'A' }],
        },
      },
      include: { sections: true },
    });
    created.push(academicClass);
  }
  return created;
}
