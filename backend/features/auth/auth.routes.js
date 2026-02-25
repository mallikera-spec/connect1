import { Router } from 'express';
import { getMe, refreshPermissions } from './auth.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/me', authMiddleware, getMe);
router.get('/refresh-permissions', authMiddleware, refreshPermissions);

export default router;
