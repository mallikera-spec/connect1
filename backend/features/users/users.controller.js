import { createUserSchema, updateUserSchema } from './users.validation.js';
import * as usersService from './users.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';

export const createUser = async (req, res) => {
    const body = createUserSchema.parse(req.body);
    const data = await usersService.createUser(body);
    successResponse(res, data, 'User created', StatusCodes.CREATED);
};

export const getAllUsers = async (req, res) => {
    const data = await usersService.getAllUsers();
    successResponse(res, data, 'Users fetched');
};

export const getUserById = async (req, res) => {
    const data = await usersService.getUserById(req.params.id);
    successResponse(res, data, 'User fetched');
};

export const updateUser = async (req, res) => {
    const body = updateUserSchema.parse(req.body);
    const data = await usersService.updateUser(req.params.id, body);
    successResponse(res, data, 'User updated');
};

export const deleteUser = async (req, res) => {
    const data = await usersService.deleteUser(req.params.id);
    successResponse(res, data, 'User deleted');
};
