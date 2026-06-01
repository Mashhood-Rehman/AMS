import express from 'express';
import {
  createClass,
  deleteClass,
  getAllClasses,
  getClassById,
  getClassOptions,
  updateClass,
} from '../controllers/classController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/options', getClassOptions);
router.get('/', getAllClasses);
router.get('/:id', getClassById);
router.post('/', createClass);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);

export default router;
