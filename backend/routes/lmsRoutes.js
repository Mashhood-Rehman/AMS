import express from 'express';
import { getLmsConfig, updateLmsConfig, verifyEmbed } from '../controllers/lmsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/config', authMiddleware, getLmsConfig);
router.post('/config', authMiddleware, updateLmsConfig);
router.get('/verify-embed', verifyEmbed);

export default router;
