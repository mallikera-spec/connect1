import { userRoleSchema } from './user-roles.validation.js';
import * as urService from './user-roles.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';

export const assignRole = async (req, res) => {
    const body = userRoleSchema.parse(req.body);
    const data = await urService.assignRoleToUser(body);
    successResponse(res, data, 'Role assigned to user', StatusCodes.CREATED);
};

export const removeRole = async (req, res) => {
    const body = userRoleSchema.parse(req.body);
    const data = await urService.removeRoleFromUser(body);
    successResponse(res, data, 'Role removed from user');
};

export const getUserRoles = async (req, res) => {
    const data = await urService.getUserRoles(req.params.userId);
    successResponse(res, data, 'User roles fetched');
};
