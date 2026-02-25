import * as reportsService from './reports.service.js';
import { successResponse } from '../../utils/apiResponse.js';

export const getProjectReport = async (req, res) => {
    const data = await reportsService.getProjectReport(req.params.id);
    successResponse(res, data, 'Project report generated');
};

export const getUserReport = async (req, res) => {
    const data = await reportsService.getUserReport(req.params.id);
    successResponse(res, data, 'User report generated');
};

export const getMyReport = async (req, res) => {
    const data = await reportsService.getUserReport(req.user.id);
    successResponse(res, data, 'My report generated');
};

export const getOverallReport = async (req, res) => {
    const data = await reportsService.getOverallReport();
    successResponse(res, data, 'Overall report generated');
};

export const getDeveloperCalendar = async (req, res) => {
    const { startDate, endDate, projectId } = req.query;
    const data = await reportsService.getDeveloperCalendarSummary({ startDate, endDate, projectId });
    successResponse(res, data, 'Developer calendar generated');
};
