import * as deptsService from './departments.service.js';
import { createDepartmentSchema, updateDepartmentSchema } from './departments.validation.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';

export const getAllDepartments = async (req, res) => {
    const data = await deptsService.getAllDepartments();
    successResponse(res, data, 'Departments fetched');
};

export const createDepartment = async (req, res) => {
    const body = createDepartmentSchema.parse(req.body);
    const data = await deptsService.createDepartment(body);
    successResponse(res, data, 'Department created', StatusCodes.CREATED);
};

export const updateDepartment = async (req, res) => {
    const body = updateDepartmentSchema.parse(req.body);
    const data = await deptsService.updateDepartment(req.params.id, body);
    successResponse(res, data, 'Department updated');
};

export const deleteDepartment = async (req, res) => {
    const data = await deptsService.deleteDepartment(req.params.id);
    successResponse(res, data, 'Department deleted');
};
