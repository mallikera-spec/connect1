import { createTaskSchema, updateTaskSchema } from './tasks.validation.js';
import * as tasksService from './tasks.service.js';
import { startTimer, stopTimer } from '../time-tracking/time-tracking.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';

export const createTask = async (req, res) => {
    const isAdmin = req.user.roles?.some(r => ['super_admin', 'project_manager', 'hr', 'tester'].includes(r.toLowerCase()));

    const body = createTaskSchema.parse(req.body);

    // If not admin, force self-assignment
    if (!isAdmin) {
        body.assigned_to = req.user.id;
    }

    const data = await tasksService.createTask(body);
    successResponse(res, data, 'Task created', StatusCodes.CREATED);
};

export const getAllTasks = async (req, res) => {
    const isAdmin = req.user.roles?.some(r =>
        ['super_admin', 'super admin', 'project_manager', 'project manager', 'hr', 'hr manager', 'tester'].includes(r.toLowerCase())
    ) || req.user.permissions?.includes('view_overall_report') || req.user.permissions?.includes('manage_projects');

    const filters = {
        project_id: req.query.project_id,
        assigned_to: isAdmin ? req.query.assigned_to : (req.query.assigned_to || req.user.id),
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
    };
    const data = await tasksService.getAllTasks(filters);
    successResponse(res, data, 'Tasks fetched');
};

export const getTaskById = async (req, res) => {
    const data = await tasksService.getTaskById(req.params.id);
    successResponse(res, data, 'Task fetched');
};

import fs from 'fs';

export const updateTask = async (req, res) => {
    const logMsg = `[${new Date().toISOString()}] UPDATE TASK ${req.params.id}: ${JSON.stringify(req.body)}\n`;
    fs.appendFileSync('c:/Users/malli/Argosmob_Projects/Dev/debug.log', logMsg);

    const body = updateTaskSchema.parse(req.body);
    const data = await tasksService.updateTask(req.params.id, body);
    successResponse(res, data, 'Task updated');
};

export const deleteTask = async (req, res) => {
    const data = await tasksService.deleteTask(req.params.id);
    successResponse(res, data, 'Task deleted');
};

export const startTaskTimer = async (req, res) => {
    const data = await startTimer(req.params.id, req.user.id);
    successResponse(res, data, 'Timer started', StatusCodes.CREATED);
};

export const stopTaskTimer = async (req, res) => {
    const data = await stopTimer(req.params.id, req.user.id);
    successResponse(res, data, 'Timer stopped');
};
