import * as service from './user-permissions.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';

export const listUserPermissions = async (req, res) => {
    const data = await service.getUserPermissions(req.params.userId);
    successResponse(res, data, 'User permissions fetched');
};

export const assignUserPermission = async (req, res) => {
    const { user_id, permission_id } = req.body;
    const data = await service.assignPermission(user_id, permission_id);
    successResponse(res, data, 'Permission assigned', StatusCodes.CREATED);
};

export const removeUserPermission = async (req, res) => {
    const { user_id, permission_id } = req.body;
    const data = await service.removePermission(user_id, permission_id);
    successResponse(res, data, 'Permission removed');
};
