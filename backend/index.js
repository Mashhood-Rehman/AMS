import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './utils/initDB.js';
import { prisma } from './db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AMS Backend is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);

// Attendance marking
app.post('/api/attendance', async (req, res) => {
  const { studentId, courseId, status, location } = req.body;
  try {
    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_courseId_date: {
          studentId,
          courseId,
          date: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'
        }
      },
      update: { status, location },
      create: { studentId, courseId, status, location }
    });
    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get reports
app.get('/api/reports/attendance', async (req, res) => {
  const { role, userId } = req.query;
  let where = {};
  if (role === 'STUDENT') where = { studentId: parseInt(userId) };
  if (role === 'TEACHER') {
    // Logic to find courses taught by teacher
    const courses = await prisma.course.findMany({ where: { teacherId: parseInt(userId) } });
    where = { courseId: { in: courses.map(c => c.id) } };
  }

  const attendance = await prisma.attendance.findMany({
    where,
    include: { student: true, course: true },
    orderBy: { date: 'desc' }
  });
  res.json({ success: true, attendance });
});

app.listen(PORT, async () => {
  console.log(`AMS Backend server running on port ${PORT}`);
  await initDB(prisma);
});
