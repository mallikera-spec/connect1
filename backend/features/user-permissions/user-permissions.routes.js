import { Router } from 'express';
import {
    listUserPermissions,
    assignUserPermission,
    removeUserPermission,
} from './user-permissions.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authMiddleware);
router.use(requirePermission('manage_user_permissions'));

router.get('/:userId', listUserPermissions);
router.post('/', assignUserPermission);
router.delete('/', removeUserPermission);

export default router;
