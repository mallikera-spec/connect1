import { Router } from 'express';
import { getMe, updateMe, setCTC, getProfile, updateProfile } from './profile.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/me', getMe);
router.patch('/me', updateMe);

// Admin routes for employee profiles
router.get('/:userId', requirePermission('manage_employees'), getProfile);
router.patch('/:userId', requirePermission('manage_employees'), updateProfile);

// Admin sets CTC of any employee
router.patch('/:userId/ctc', requirePermission('manage_employees'), setCTC);

export default router;
