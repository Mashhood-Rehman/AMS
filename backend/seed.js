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
      permissions: ['dashboard', 'institutes', 'attendance', 'students', 'courses', 'reports', 'settings', 'user-logs'],
    },
  });

  // Create a Principal and Institute
  const principal = await prisma.user.upsert({
    where: { email: 'principal@ams.com' },
    update: { password: commonPassword },
    create: {
      email: 'principal@ams.com',
      password: commonPassword,
      name: 'Mr. Principal',
      role: 'PRINCIPAL',
      permissions: ['dashboard', 'attendance', 'students', 'courses', 'reports', 'settings', 'user-logs'],
    }
  });

  const institute = await prisma.institute.upsert({
    where: { principalId: principal.id },
    update: { maxClass: 10 },
    create: {
      name: 'The Educators',
      maxClass: 10,
      principalId: principal.id
    }
  });

  await prisma.user.update({
    where: { id: principal.id },
    data: { institute: { connect: { id: institute.id } } }
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
      institute: { connect: { id: institute.id } },
      permissions: ['dashboard', 'attendance', 'students', 'courses', 'reports'],
    },
  });

  // Create a Course
  const course = await prisma.course.upsert({
    where: { code: 'CS101' },
    update: {},
    create: {
      name: 'Computer Science 101',
      code: 'CS101',
      teacher: { connect: { id: teacher.id } },
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
        institute: { connect: { id: institute.id } },
        className: 'Class 5'
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
