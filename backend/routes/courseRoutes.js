import express from 'express';
import { getAllCourses } from '../controllers/courseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication to all course routes
router.use(authMiddleware);

// Routes
router.get('/', getAllCourses);

export default router;
