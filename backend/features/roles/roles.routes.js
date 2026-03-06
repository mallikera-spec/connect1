import { Router } from 'express';
import { createRole, getAllRoles, updateRole, deleteRole } from './roles.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authMiddleware);
// Mutating routes require manage_roles
router.post('/', requirePermission('manage_roles'), createRole);
router.patch('/:id', requirePermission('manage_roles'), updateRole);
router.delete('/:id', requirePermission('manage_roles'), deleteRole);

// View roles: allow hr/HR Manager and users with view_employees perm
router.get('/', requirePermission('view_employees', ['hr', 'HR Manager', 'tester', 'bdm', 'sales manager']), getAllRoles);

export default router;
