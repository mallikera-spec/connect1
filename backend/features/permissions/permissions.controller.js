import { createPermissionSchema } from './permissions.validation.js';
import * as permissionsService from './permissions.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';

export const createPermission = async (req, res) => {
    const body = createPermissionSchema.parse(req.body);
    const data = await permissionsService.createPermission(body);
    successResponse(res, data, 'Permission created', StatusCodes.CREATED);
};

export const getAllPermissions = async (req, res) => {
    const data = await permissionsService.getAllPermissions();
    successResponse(res, data, 'Permissions fetched');
};

export const deletePermission = async (req, res) => {
    const data = await permissionsService.deletePermission(req.params.id);
    successResponse(res, data, 'Permission deleted');
};
