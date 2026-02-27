import { Router } from 'express';
import { getProjectReport, getUserReport, getOverallReport, getMyReport, getDeveloperCalendar, getEmployeeOverview } from './reports.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/me', getMyReport);

// Granular permissions
router.get('/project/:id', requirePermission('view_project_report'), getProjectReport);
router.get('/user/:id', requirePermission('view_user_report'), getUserReport);
router.get('/overall', requirePermission('view_overall_report'), getOverallReport);
router.get('/employee-overview', requirePermission('view_overall_report'), getEmployeeOverview);
router.get('/calendar', requirePermission('view_reports'), getDeveloperCalendar);

export default router;
