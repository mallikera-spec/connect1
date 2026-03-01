import { Router } from 'express';
import { getMilestones, getOverallMilestones, createMilestone, updateMilestone, deleteMilestone } from './milestones.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/overall', requirePermission('view_overall_report'), getOverallMilestones);
router.get('/project/:projectId', requirePermission('view_projects'), getMilestones);
router.post('/project/:projectId', requirePermission('manage_projects'), createMilestone);
router.patch('/:id', requirePermission('manage_projects'), updateMilestone);
router.delete('/:id', requirePermission('manage_projects'), deleteMilestone);

export default router;
