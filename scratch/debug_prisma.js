import { PrismaClient } from './backend/generated/prisma/index.js';

const prisma = new PrismaClient();

async function debug() {
  try {
    console.log('Attempting to fetch users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        taughtCourses: {
          select: { id: true, name: true, code: true }
        },
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log('Successfully fetched users:', users.length);
  } catch (error) {
    console.error('Prisma Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
