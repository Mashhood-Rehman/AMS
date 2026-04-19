import { prisma } from './db.js';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import bcrypt from 'bcryptjs';

neonConfig.webSocketConstructor = ws;

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const commonPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ams.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@ams.com',
      password: adminPassword,
      name: 'System Admin',
      role: 'ADMIN',
    },
  });

  // Create a Teacher
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@ams.com' },
    update: { password: commonPassword },
    create: {
      email: 'teacher@ams.com',
      password: commonPassword,
      name: 'Dr. Smith',
      role: 'TEACHER',
    },
  });

  // Create a Course
  const course = await prisma.course.upsert({
    where: { code: 'CS101' },
    update: {},
    create: {
      name: 'Computer Science 101',
      code: 'CS101',
      teacherId: teacher.id,
    },
  });

  // Create Students
  const students = [
    { email: 'student1@ams.com', name: 'Alice Johnson' },
    { email: 'student2@ams.com', name: 'Bob Smith' },
    { email: 'student3@ams.com', name: 'Charlie Brown' },
  ];

  for (const s of students) {
    const student = await prisma.user.upsert({
      where: { email: s.email },
      update: { password: commonPassword },
      create: {
        email: s.email,
        password: commonPassword,
        name: s.name,
        role: 'STUDENT',
      },
    });

    // Enroll student
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
      update: {},
      create: { studentId: student.id, courseId: course.id },
    });

    // Initial Attendance
    await prisma.attendance.upsert({
      where: { studentId_courseId_date: { studentId: student.id, courseId: course.id, date: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z' } },
      update: {},
      create: { studentId: student.id, courseId: course.id, status: 'PRESENT' },
    });
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
