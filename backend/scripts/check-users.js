import 'dotenv/config';
import { prisma } from '../db.js';

try {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, name: true },
  });
  console.log('count', users.length);
  console.log(JSON.stringify(users, null, 2));
} catch (e) {
  console.error('findMany failed:', e.message);
}

await prisma.$disconnect();
