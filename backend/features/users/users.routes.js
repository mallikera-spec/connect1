import { Router } from 'express';
import multer from 'multer';
import { createUser, getAllUsers, getUserById, updateUser, deleteUser, uploadAvatar } from './users.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit for avatars

router.use(authMiddleware);

router.post('/', requirePermission('create_user'), createUser);
router.get('/', requirePermission('view_users', ['tester']), getAllUsers);
router.get('/:id', requirePermission('view_users'), getUserById);
router.patch('/:id', requirePermission('edit_user'), updateUser);
router.delete('/:id', requirePermission('delete_user'), deleteUser);
router.post('/avatar/:id', upload.single('avatar'), uploadAvatar);

export default router;
