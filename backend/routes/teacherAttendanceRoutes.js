import express from 'express';
import {
  markTeacherAttendance,
  adminOverrideTeacherAttendance,
  getTeacherAttendance,
  getTodayTeacherAttendance,
  getAllTeachersToday,
} from '../controllers/teacherAttendanceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/mark', markTeacherAttendance);

router.post('/override', adminOverrideTeacherAttendance);

router.get('/today', getTodayTeacherAttendance);

router.get('/all-today', getAllTeachersToday);

router.get('/', getTeacherAttendance);

export default router;