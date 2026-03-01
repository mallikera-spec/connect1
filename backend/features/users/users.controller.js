import { createUserSchema, updateUserSchema } from './users.validation.js';
import * as usersService from './users.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';
import cloudinary from '../../config/cloudinary.js';

export const createUser = async (req, res) => {
    const body = createUserSchema.parse(req.body);
    const data = await usersService.createUser(body);
    successResponse(res, data, 'User created', StatusCodes.CREATED);
};

export const getAllUsers = async (req, res) => {
    const data = await usersService.getAllUsers(req.query);
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

export const uploadAvatar = async (req, res) => {
    const { id } = req.params;

    // Ensure user exists
    const user = await usersService.getUserById(id);
    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
    }

    if (!req.file) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'No file uploaded' });
    }

    // Upload buffer to Cloudinary
    try {
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'connect/profile',
                    resource_type: 'image',
                    public_id: `avatar_${id}_${Date.now()}`
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        // Save URL to database
        const updatedUser = await usersService.updateUser(id, { avatar_url: uploadResult.secure_url });

        successResponse(res, updatedUser, 'Avatar uploaded successfully');
    } catch (error) {
        console.error('Avatar upload failed:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to upload avatar' });
    }
};
