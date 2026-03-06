import { Router } from 'express';
import { assignRole, removeRole, getUserRoles } from './user-roles.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authMiddleware);
router.use(requirePermission('assign_role', ['hr', 'HR Manager']));

router.get('/:userId', getUserRoles);
router.post('/', assignRole);
router.delete('/', removeRole);

export default router;
