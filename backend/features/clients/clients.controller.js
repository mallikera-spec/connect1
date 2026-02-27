import { createClientSchema, updateClientSchema } from './clients.validation.js';
import * as clientsService from './clients.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';

export const createClient = async (req, res) => {
    const body = createClientSchema.parse(req.body);
    const data = await clientsService.createClient(body, req.user.id);
    successResponse(res, data, 'Client created', StatusCodes.CREATED);
};

export const getAllClients = async (req, res) => {
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('super_admin') || userRoles.includes('admin') || userRoles.includes('project_manager') || userRoles.includes('sales_manager') || userRoles.includes('Super Admin') || userRoles.includes('Admin') || userRoles.includes('Project Manager') || userRoles.includes('Sales Manager');

    let options = {
        status: req.query.status,
        search: req.query.search
    };

    if (!isAdmin) {
        options.ownerId = req.user.id;
    }

    const data = await clientsService.getAllClients(options);
    successResponse(res, data, 'Clients fetched');
};

export const getClientById = async (req, res) => {
    const data = await clientsService.getClientById(req.params.id);
    successResponse(res, data, 'Client fetched');
};

export const updateClient = async (req, res) => {
    const body = updateClientSchema.parse(req.body);
    const data = await clientsService.updateClient(req.params.id, body);
    successResponse(res, data, 'Client updated');
};

export const deleteClient = async (req, res) => {
    const data = await clientsService.deleteClient(req.params.id);
    successResponse(res, data, 'Client deleted');
};
