import { createTaskSchema, updateTaskSchema } from './tasks.validation.js';
import * as tasksService from './tasks.service.js';
import { startTimer, stopTimer } from '../time-tracking/time-tracking.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

export const createTask = async (req, res) => {
    const isAdmin = req.user.roles?.some(r => ['super_admin', 'director', 'project_manager', 'hr', 'tester'].includes(r.toLowerCase()));

    const body = createTaskSchema.parse(req.body);

    // If not admin, force self-assignment
    if (!isAdmin) {
        body.assigned_to = req.user.id;
    }

    const data = await tasksService.createTask(body);
    successResponse(res, data, 'Task created', StatusCodes.CREATED);
};

export const bulkCreateTasks = async (req, res) => {
    const tasksArraySchema = z.array(createTaskSchema);
    const body = tasksArraySchema.parse(req.body);

    const data = await tasksService.bulkCreateTasks(body);
    successResponse(res, data, `${data.length} tasks created`, StatusCodes.CREATED);
};

export const bulkUpdateTasks = async (req, res) => {
    const bulkUpdateSchema = z.object({
        ids: z.array(z.string().uuid()),
        updates: updateTaskSchema
    });
    const { ids, updates } = bulkUpdateSchema.parse(req.body);

    const data = await tasksService.bulkUpdateTasks(ids, updates, req.user);
    successResponse(res, data, `${data.length} tasks updated`);
};

export const bulkDeleteTasks = async (req, res) => {
    const bulkDeleteSchema = z.object({
        ids: z.array(z.string().uuid())
    });
    const { ids } = bulkDeleteSchema.parse(req.body);

    const data = await tasksService.bulkDeleteTasks(ids);
    successResponse(res, data, `${ids.length} tasks deleted`);
};

export const getAllTasks = async (req, res) => {
    const isAdmin = req.user.roles?.some(r =>
        ['super_admin', 'super admin', 'director', 'project_manager', 'project manager', 'hr', 'hr manager', 'tester'].includes(r.toLowerCase())
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
    try {
        const logMsg = `[${new Date().toISOString()}] UPDATE TASK ${req.params.id}: ${JSON.stringify(req.body)}\n`;
        fs.appendFileSync('debug.log', logMsg);
    } catch (err) {
        console.error('Failed to write to debug.log:', err.message);
    }

    const body = updateTaskSchema.parse(req.body);
    const data = await tasksService.updateTask(req.params.id, body, req.user);
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
