import { Router } from 'express';
import { createRole, getAllRoles, updateRole, deleteRole } from './roles.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authMiddleware);
router.use(requirePermission('manage_roles'));

router.post('/', createRole);
router.get('/', getAllRoles);
router.patch('/:id', updateRole);
router.delete('/:id', deleteRole);

export default router;
