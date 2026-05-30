import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { exportBackup, restoreBackup } from '../controllers/backupController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/export', exportBackup);
router.post('/restore', restoreBackup);

export default router;
