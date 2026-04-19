import express from 'express';
import { 
  getAllCourses, 
  createCourse, 
  updateCourse, 
  deleteCourse, 
  getCourseById 
} from '../controllers/courseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication to all course routes
router.use(authMiddleware);

// Routes
router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/', createCourse);
router.put('/:id', updateCourse);
router.delete('/:id', deleteCourse);

export default router;
