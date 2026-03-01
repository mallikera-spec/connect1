import * as hrService from './hr.service.js';

// --- Attendance ---
export const clockIn = async (req, res, next) => {
    try {
        const { date, time } = req.body;
        const data = await hrService.clockIn(req.user.id, date, time);
        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const clockOut = async (req, res, next) => {
    try {
        const { date, time } = req.body;
        const data = await hrService.clockOut(req.user.id, date, time);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getMyAttendance = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        const data = await hrService.getMyAttendance(req.user.id, month, year);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getPendingAttendance = async (req, res, next) => {
    try {
        const data = await hrService.getAllPendingAttendance();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const approveAttendanceRecord = async (req, res, next) => {
    try {
        const { status, is_approved, admin_comment } = req.body;
        const data = await hrService.approveAttendance(req.params.id, status, is_approved, req.user.id, admin_comment);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// --- Leaves ---
export const submitLeaveRequest = async (req, res, next) => {
    try {
        const data = await hrService.submitLeaveRequest(req.user.id, req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getMyLeaves = async (req, res, next) => {
    try {
        const data = await hrService.getMyLeaves(req.user.id);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getPendingLeaves = async (req, res, next) => {
    try {
        const data = await hrService.getAllPendingLeaves();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const updateLeaveStatus = async (req, res, next) => {
    try {
        const { status, admin_comment } = req.body;
        const data = await hrService.updateLeaveStatus(req.params.id, status, req.user.id, admin_comment);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getLeaveBalance = async (req, res, next) => {
    try {
        // Can optionally pass a userId in query if an admin is checking someone else's balance
        const userId = req.query.userId || req.user.id;
        const balanceInfo = await hrService.calculateAvailableLeaves(userId);
        res.json({ success: true, data: balanceInfo });
    } catch (error) {
        next(error);
    }
};

// --- Payroll ---
export const generateSalarySlips = async (req, res, next) => {
    try {
        const { userId, month, year } = req.body;
        const data = await hrService.generateSalarySlip(userId, month, year, req.user.id);
        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getMySalarySlips = async (req, res, next) => {
    try {
        const data = await hrService.getMySalarySlips(req.user.id);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getAllSalarySlips = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        const data = await hrService.getAllSalarySlips(month, year);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getAttendanceReport = async (req, res, next) => {
    try {
        const { userId, startDate, endDate, status } = req.query;
        const data = await hrService.getAttendanceReport({ userId, startDate, endDate, status });
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
