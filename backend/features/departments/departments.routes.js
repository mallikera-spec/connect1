import { Router } from 'express';
import {
    getAllDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
} from './departments.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authMiddleware);

// View is public to all authenticated users (needed for user create/edit dropdowns)
router.get('/', getAllDepartments);

router.post('/', requirePermission('manage_departments'), createDepartment);
router.patch('/:id', requirePermission('manage_departments'), updateDepartment);
router.delete('/:id', requirePermission('manage_departments'), deleteDepartment);

export default router;
