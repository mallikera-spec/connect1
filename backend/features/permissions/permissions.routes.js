import { Router } from 'express';
import { createPermission, getAllPermissions, deletePermission } from './permissions.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authMiddleware);
router.use(requirePermission('manage_permissions'));

router.post('/', createPermission);
router.get('/', getAllPermissions);
router.delete('/:id', deletePermission);

export default router;
