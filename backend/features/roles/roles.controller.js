import { createRoleSchema, updateRoleSchema } from './roles.validation.js';
import * as rolesService from './roles.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';

export const createRole = async (req, res) => {
    const body = createRoleSchema.parse(req.body);
    const data = await rolesService.createRole(body);
    successResponse(res, data, 'Role created', StatusCodes.CREATED);
};

export const getAllRoles = async (req, res) => {
    const data = await rolesService.getAllRoles();
    successResponse(res, data, 'Roles fetched');
};

export const updateRole = async (req, res) => {
    const body = updateRoleSchema.parse(req.body);
    const data = await rolesService.updateRole(req.params.id, body);
    successResponse(res, data, 'Role updated');
};

export const deleteRole = async (req, res) => {
    const data = await rolesService.deleteRole(req.params.id);
    successResponse(res, data, 'Role deleted');
};
