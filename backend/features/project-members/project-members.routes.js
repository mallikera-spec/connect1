import { Router } from 'express';
import { getMembers, addMember, removeMember, updateMemberRole } from './project-members.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router({ mergeParams: true }); // inherit :id from parent

router.use(authMiddleware);

router.get('/', getMembers);
router.post('/', requirePermission('manage_projects'), addMember);
router.patch('/:userId', requirePermission('manage_projects'), updateMemberRole);
router.delete('/:userId', requirePermission('manage_projects'), removeMember);

export default router;
