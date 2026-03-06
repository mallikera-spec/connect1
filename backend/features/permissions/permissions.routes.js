import { Router } from 'express';
import { createPermission, getAllPermissions, deletePermission } from './permissions.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authMiddleware);
// Mutating routes require manage_permissions
router.post('/', requirePermission('manage_permissions'), createPermission);
router.delete('/:id', requirePermission('manage_permissions'), deletePermission);

// View permissions: allow hr/HR Manager and users with view_employees perm
router.get('/', requirePermission('view_employees', ['hr', 'HR Manager', 'tester', 'bdm', 'sales manager']), getAllPermissions);

export default router;
