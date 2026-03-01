import express from 'express';
import * as hrController from './hr.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = express.Router();

// All HR routes require authentication
router.use(authMiddleware);

// --- Attendance ---
router.post('/attendance/clock-in', hrController.clockIn);
router.post('/attendance/clock-out', hrController.clockOut);
router.get('/attendance/my', hrController.getMyAttendance);
router.get('/attendance/report', hrController.getAttendanceReport);

// Admin / Manager Attendance Management
router.get('/attendance/pending', requirePermission('view_employees'), hrController.getPendingAttendance);
router.patch('/attendance/:id/approve', requirePermission('view_employees'), hrController.approveAttendanceRecord);

// --- Leaves ---
router.post('/leaves', hrController.submitLeaveRequest);
router.get('/leaves/my', hrController.getMyLeaves);
router.get('/leaves/balance', hrController.getLeaveBalance);

// Admin / Manager Leaves Management
router.get('/leaves/pending', requirePermission('view_employees'), hrController.getPendingLeaves);
router.patch('/leaves/:id/status', requirePermission('view_employees'), hrController.updateLeaveStatus);

// --- Payroll (Admin Only Mostly) ---
router.get('/payroll/my', hrController.getMySalarySlips);

// Admin Payroll Management
router.post('/payroll/generate', requirePermission('view_employees'), hrController.generateSalarySlips);
router.get('/payroll/all', requirePermission('view_employees'), hrController.getAllSalarySlips);

export default router;
