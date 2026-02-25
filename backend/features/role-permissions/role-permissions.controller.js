import { rolePermissionSchema } from './role-permissions.validation.js';
import * as rpService from './role-permissions.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';

export const assignPermission = async (req, res) => {
    const body = rolePermissionSchema.parse(req.body);
    const data = await rpService.assignPermissionToRole(body);
    successResponse(res, data, 'Permission assigned to role', StatusCodes.CREATED);
};

export const removePermission = async (req, res) => {
    const body = rolePermissionSchema.parse(req.body);
    const data = await rpService.removePermissionFromRole(body);
    successResponse(res, data, 'Permission removed from role');
};
