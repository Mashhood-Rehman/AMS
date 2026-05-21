import express from 'express';
import { getLmsConfig, updateLmsConfig, verifyEmbed, syncLmsData, syncLmsTeachers, syncLmsStudents, syncLmsCourses, syncLmsEnrollments } from '../controllers/lmsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/config', authMiddleware, getLmsConfig);
router.post('/config', authMiddleware, updateLmsConfig);
router.get('/verify-embed', verifyEmbed);

router.post('/sync', authMiddleware, syncLmsData);
router.post('/sync/batch', authMiddleware, syncLmsData);
router.post('/sync/teachers', authMiddleware, syncLmsTeachers);
router.post('/sync/students', authMiddleware, syncLmsStudents);
router.post('/sync/courses', authMiddleware, syncLmsCourses);
router.post('/sync/enrollments', authMiddleware, syncLmsEnrollments);

export default router;
