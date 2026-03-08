import * as reportsService from './reports.service.js';
import { successResponse } from '../../utils/apiResponse.js';

export const getProjectReport = async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await reportsService.getProjectReport(req.params.id, { startDate, endDate });
    successResponse(res, data, 'Project report generated');
};

export const getProjectsReport = async (req, res) => {
    const { ids, startDate, endDate } = req.query;
    const projectIds = ids ? ids.split(',') : [];
    const data = await reportsService.getProjectsReport(projectIds, { startDate, endDate });
    successResponse(res, data, 'Projects report generated');
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

import { executeAIQuery } from './reports.ai.service.js';

export const askAIQuery = async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400).json({ success: false, message: 'Question is required' });
        }

        const data = await executeAIQuery(question);
        successResponse(res, data, 'AI Query Executed Successfully');
    } catch (error) {
        console.error('askAIQuery Controller Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to process AI query' });
    }
};
