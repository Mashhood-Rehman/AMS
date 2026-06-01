import { prisma } from './db.js';
import bcrypt from 'bcryptjs';
import { seedInstituteClasses } from './utils/seedInstituteClasses.js';


async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const commonPassword = await bcrypt.hash('password123', 10);

  const adminPermissions = [
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

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ams.com' },
    update: { password: adminPassword, permissions: adminPermissions },
    create: {
      email: 'admin@ams.com',
      password: adminPassword,
      name: 'System Admin',
      role: 'ADMIN',
      permissions: adminPermissions,
    },
  });

  // Create an Institute without a principal role
  let institute = await prisma.institute.findFirst({ where: { name: 'The Educators' } });
  if (!institute) {
    institute = await prisma.institute.create({
      data: {
        name: 'The Educators',
        maxClass: 10,
        address: '123 Main St',
        phone: '+1 555 000 1111'
      }
    });
  } else {
    institute = await prisma.institute.update({
      where: { id: institute.id },
      data: { maxClass: 10, address: '123 Main St', phone: '+1 555 000 1111' }
    });
  }

  const classCount = await prisma.academicClass.count({ where: { instituteId: institute.id } });
  if (classCount === 0) {
    await seedInstituteClasses(institute.id, institute.maxClass);
  }

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
      permissions: ['dashboard', 'attendance', 'students', 'courses', 'classes', 'reports'],
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
        permissions: ['dashboard', 'edit-profile'],
        className: 'Class 5 - Section A'
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
