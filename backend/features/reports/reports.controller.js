import * as reportsService from './reports.service.js';
import { successResponse } from '../../utils/apiResponse.js';

export const getProjectReport = async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await reportsService.getProjectReport(req.params.id, { startDate, endDate });
    successResponse(res, data, 'Project report generated');
};

export const getUserReport = async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await reportsService.getUserReport(req.params.id, { startDate, endDate });
    successResponse(res, data, 'User report generated');
};

export const getMyReport = async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await reportsService.getUserReport(req.user.id, {
        startDate,
        endDate,
        roles: req.user.roles
    });
    successResponse(res, data, 'My report generated');
};

export const getOverallReport = async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await reportsService.getOverallReport({ startDate, endDate });
    successResponse(res, data, 'Overall report generated');
};

export const getDeveloperCalendar = async (req, res) => {
    const { startDate, endDate, projectId } = req.query;
    const data = await reportsService.getDeveloperCalendarSummary({ startDate, endDate, projectId });
    successResponse(res, data, 'Developer calendar generated');
};

export const getEmployeeOverview = async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await reportsService.getEmployeeOverview({ startDate, endDate });
    successResponse(res, data, 'Employee overview generated');
};

export const getHROverview = async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await reportsService.getHROverview({ startDate, endDate });
    successResponse(res, data, 'HR overview generated');
};
