import { Router } from 'express';
import { getMe, refreshPermissions, getDailyQuote } from './auth.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/me', authMiddleware, getMe);
router.get('/refresh-permissions', authMiddleware, refreshPermissions);
router.get('/daily-quote', getDailyQuote);

export default router;
