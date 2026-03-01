import * as svc from './timesheets.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

const entrySchema = z.object({
    title: z.string().min(1),
    status: z.enum(['todo', 'in_progress', 'done', 'blocked', 'verified', 'failed']).default('todo'),
    hours_spent: z.string().regex(/^([0-9]{1,2}):([0-5][0-9])$/, 'Invalid time format (hh:mm)').default('00:00'),
    notes: z.string().optional(),
    task_id: z.string().uuid().optional(),
    project_id: z.string().uuid().optional(),
    admin_feedback: z.string().optional(),
    developer_reply: z.string().optional(),
    qa_notes: z.string().optional(),
});

const updateEntrySchema = z.object({
    title: z.string().min(1).optional(),
    status: z.enum(['todo', 'in_progress', 'done', 'blocked', 'verified', 'failed']).optional(),
    hours_spent: z.string().regex(/^([0-9]{1,2}):([0-5][0-9])$/, 'Invalid time format (hh:mm)').optional(),
    notes: z.string().optional(),
    task_id: z.string().uuid().optional(),
    project_id: z.string().uuid().optional(),
    admin_feedback: z.string().optional(),
    developer_reply: z.string().optional(),
    qa_notes: z.string().optional(),
});

// GET /timesheets/me?date=YYYY-MM-DD
export const getMyToday = async (req, res) => {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const data = await svc.getOrCreateTimesheet(req.user.id, date);
    successResponse(res, data, 'Timesheet fetched');
};

// GET /timesheets/my-history
export const getMyHistory = async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await svc.getMyTimesheets(req.user.id, { startDate, endDate });
    successResponse(res, data, 'Timesheet history fetched');
};

// GET /timesheets/project/:projectId
export const getProjectTimesheets = async (req, res) => {
    const data = await svc.getEntriesByProject(req.params.projectId);
    successResponse(res, data, 'Project timesheets fetched');
};

// GET /timesheets  (admin — all users)
export const getAllTimesheets = async (req, res) => {
    const { userId, date, startDate, endDate, userIds } = req.query;

    // Convert userIds string (comma separated) to array if present
    const userIdsArray = userIds ? userIds.split(',') : [];

    const data = await svc.getAllTimesheets({
        userId,
        date,
        startDate,
        endDate,
        userIds: userIdsArray
    });
    successResponse(res, data, 'Timesheets fetched');
};

// POST /timesheets/:id/entries
export const addEntry = async (req, res) => {
    const body = entrySchema.parse(req.body);
    const data = await svc.addEntry(req.params.id, body);
    successResponse(res, data, 'Entry added', StatusCodes.CREATED);
};

// PATCH /timesheets/entries/:entryId
export const updateEntry = async (req, res) => {
    const body = updateEntrySchema.parse(req.body);
    const data = await svc.updateEntry(req.params.entryId, body);
    successResponse(res, data, 'Entry updated');
};

// DELETE /timesheets/entries/:entryId
export const deleteEntry = async (req, res) => {
    const data = await svc.deleteEntry(req.params.entryId);
    successResponse(res, data, 'Entry deleted');
};
