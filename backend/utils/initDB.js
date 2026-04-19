import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const initDB = async (prisma) => {
  console.log('Checking database for admin user...');
  try {
    const adminExists = await prisma.user.findFirst({
      where: {
        role: Role.ADMIN
      }
    });

    if (!adminExists) {
      console.log('No admin user found. Creating default admin...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          email: 'admin@ams.com',
          password: hashedPassword,
          name: 'System Admin',
          role: Role.ADMIN
        }
      });
      console.log('Default admin user created successfully.');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};
