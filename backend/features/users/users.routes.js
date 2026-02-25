import { Router } from 'express';
import { createUser, getAllUsers, getUserById, updateUser, deleteUser } from './users.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', requirePermission('create_user'), createUser);
router.get('/', requirePermission('view_users'), getAllUsers);
router.get('/:id', requirePermission('view_users'), getUserById);
router.patch('/:id', requirePermission('edit_user'), updateUser);
router.delete('/:id', requirePermission('delete_user'), deleteUser);

export default router;
