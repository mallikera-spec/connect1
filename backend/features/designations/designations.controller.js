import * as svc from './designations.service.js';
import { createDesignationSchema, updateDesignationSchema } from './designations.validation.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';

export const getAllDesignations = async (req, res) => {
    const data = await svc.getAllDesignations();
    successResponse(res, data, 'Designations fetched');
};

export const createDesignation = async (req, res) => {
    const body = createDesignationSchema.parse(req.body);
    const data = await svc.createDesignation(body);
    successResponse(res, data, 'Designation created', StatusCodes.CREATED);
};

export const updateDesignation = async (req, res) => {
    const body = updateDesignationSchema.parse(req.body);
    const data = await svc.updateDesignation(req.params.id, body);
    successResponse(res, data, 'Designation updated');
};

export const deleteDesignation = async (req, res) => {
    const data = await svc.deleteDesignation(req.params.id);
    successResponse(res, data, 'Designation deleted');
};
