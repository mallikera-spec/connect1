import * as payrollService from './payroll.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const calculatePayroll = async (req, res, next) => {
    try {
        const { month, year } = req.body;
        if (!month || !year) {
            return errorResponse(res, 'Month and year are required', 400);
        }

        const data = await payrollService.calculatePayroll(month, year);
        successResponse(res, data, 'Payroll calculated and drafts generated successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const publishPayroll = async (req, res, next) => {
    try {
        const { periodId } = req.params;
        const data = await payrollService.publishPayroll(periodId);
        successResponse(res, data, 'Payroll published successfully');
    } catch (error) {
        next(error);
    }
};

export const getPayrollPeriods = async (req, res, next) => {
    try {
        const data = await payrollService.getPayrollPeriods();
        successResponse(res, data, 'Fetched payroll periods');
    } catch (error) {
        next(error);
    }
};

export const getSalarySlips = async (req, res, next) => {
    try {
        const { periodId } = req.query;
        const data = await payrollService.getSalarySlips(periodId);
        successResponse(res, data, 'Fetched salary slips');
    } catch (error) {
        next(error);
    }
};

export const getMySalarySlips = async (req, res, next) => {
    try {
        const data = await payrollService.getMySalarySlips(req.user.id);
        successResponse(res, data, 'Fetched my salary slips');
    } catch (error) {
        next(error);
    }
};
