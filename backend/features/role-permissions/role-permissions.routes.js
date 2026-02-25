import { Router } from 'express';
import { assignPermission, removePermission } from './role-permissions.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authMiddleware);
router.use(requirePermission('manage_roles'));

router.post('/', assignPermission);
router.delete('/', removePermission);

export default router;
