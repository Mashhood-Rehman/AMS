import express from 'express';
import { 
  createInstitute, 
  getAllInstitutes, 
  getInstituteById, 
  updateInstitute, 
  deleteInstitute 
} from '../controllers/instituteController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllInstitutes);
router.get('/:id', getInstituteById);
router.post('/', createInstitute);
router.put('/:id', updateInstitute);
router.delete('/:id', deleteInstitute);

export default router;
