import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './utils/initDB.js';
import { prisma } from './db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import instituteRoutes from './routes/instituteRoutes.js';
import lmsRoutes from './routes/lmsRoutes.js';
import teacherAttendanceRoutes from './routes/teacherAttendanceRoutes.js';
import backupRoutes from './routes/backupRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/lms', lmsRoutes);
app.use('/api/teacher-attendance', teacherAttendanceRoutes);
app.use('/api/backup', backupRoutes);


app.listen(PORT, async () => {
  console.log(`AMS Backend server running on port ${PORT}`);
  await initDB(prisma);
});
