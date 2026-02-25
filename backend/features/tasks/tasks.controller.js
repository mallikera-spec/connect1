import { createTaskSchema, updateTaskSchema } from './tasks.validation.js';
import * as tasksService from './tasks.service.js';
import { startTimer, stopTimer } from '../time-tracking/time-tracking.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';

export const createTask = async (req, res) => {
    const isAdmin = req.user.roles?.some(r => ['super_admin', 'project_manager', 'hr'].includes(r));

    const body = createTaskSchema.parse(req.body);

    // If not admin, force self-assignment
    if (!isAdmin) {
        body.assigned_to = req.user.id;
    }

    const data = await tasksService.createTask(body);
    successResponse(res, data, 'Task created', StatusCodes.CREATED);
};

export const getAllTasks = async (req, res) => {
    const isAdmin = req.user.roles?.some(r => ['super_admin', 'project_manager', 'hr'].includes(r));

    const filters = {
        project_id: req.query.project_id,
        assigned_to: isAdmin ? req.query.assigned_to : (req.query.assigned_to || req.user.id),
        status: req.query.status,
    };
    const data = await tasksService.getAllTasks(filters);
    successResponse(res, data, 'Tasks fetched');
};

export const getTaskById = async (req, res) => {
    const data = await tasksService.getTaskById(req.params.id);
    successResponse(res, data, 'Task fetched');
};

export const updateTask = async (req, res) => {
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
