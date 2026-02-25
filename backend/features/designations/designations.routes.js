import { Router } from 'express';
import {
    getAllDesignations,
    createDesignation,
    updateDesignation,
    deleteDesignation,
} from './designations.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authMiddleware);

// Read: open to all authenticated users (needed for dropdowns in user create/edit)
router.get('/', getAllDesignations);

// Write: requires manage_designations permission
router.post('/', requirePermission('manage_designations'), createDesignation);
router.patch('/:id', requirePermission('manage_designations'), updateDesignation);
router.delete('/:id', requirePermission('manage_designations'), deleteDesignation);

export default router;
