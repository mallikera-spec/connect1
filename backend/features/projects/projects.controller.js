import { createProjectSchema, updateProjectSchema } from './projects.validation.js';
import * as projectsService from './projects.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';

export const createProject = async (req, res) => {
    const body = createProjectSchema.parse(req.body);
    const data = await projectsService.createProject(body, req.user.id);
    successResponse(res, data, 'Project created', StatusCodes.CREATED);
};

export const getAllProjects = async (req, res) => {
    const isAdmin = req.user.roles?.some(r => ['super_admin', 'project_manager', 'hr', 'tester'].includes(r.toLowerCase()));

    let options = {};
    if (isAdmin) {
        if (req.query.memberUserId) options.memberUserId = req.query.memberUserId;
    } else {
        options.memberUserId = req.user.id;
    }

    if (req.query.startDate) options.startDate = req.query.startDate;
    if (req.query.endDate) options.endDate = req.query.endDate;
    if (req.query.status) options.status = req.query.status;

    const data = await projectsService.getAllProjects(options);
    successResponse(res, data, 'Projects fetched');
};

export const getProjectById = async (req, res) => {
    const data = await projectsService.getProjectById(req.params.id);
    successResponse(res, data, 'Project fetched');
};

export const updateProject = async (req, res) => {
    const body = updateProjectSchema.parse(req.body);
    const data = await projectsService.updateProject(req.params.id, body);
    successResponse(res, data, 'Project updated');
};

export const deleteProject = async (req, res) => {
    const data = await projectsService.deleteProject(req.params.id);
    successResponse(res, data, 'Project deleted');
};
