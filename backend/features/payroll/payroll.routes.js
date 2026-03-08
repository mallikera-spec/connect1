import { Router } from 'express';
import {
    calculatePayroll,
    publishPayroll,
    getPayrollPeriods,
    getSalarySlips,
    getMySalarySlips
} from './payroll.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();
router.use(authMiddleware);

// Employee route
router.get('/my-slips', getMySalarySlips);

// HR/Admin routes
router.post('/calculate', requirePermission('manage_roles'), calculatePayroll); // Ideally manage_payroll, but defaulting to manage_roles for safety since they are admins
router.post('/publish/:periodId', requirePermission('manage_roles'), publishPayroll);
router.get('/periods', requirePermission('manage_roles'), getPayrollPeriods);
router.get('/slips', requirePermission('manage_roles'), getSalarySlips);

export default router;
