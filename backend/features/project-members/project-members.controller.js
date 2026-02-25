import * as svc from './project-members.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

const addSchema = z.object({
    user_id: z.string().uuid(),
    role: z.enum(['manager', 'member']).default('member'),
});

export const getMembers = async (req, res) => {
    const data = await svc.getProjectMembers(req.params.id);
    successResponse(res, data, 'Project members fetched');
};

export const addMember = async (req, res) => {
    const body = addSchema.parse(req.body);
    const data = await svc.addProjectMember(req.params.id, body);
    successResponse(res, data, 'Member added', StatusCodes.CREATED);
};

export const removeMember = async (req, res) => {
    const data = await svc.removeProjectMember(req.params.id, req.params.userId);
    successResponse(res, data, 'Member removed');
};

export const updateMemberRole = async (req, res) => {
    const { role } = z.object({ role: z.enum(['manager', 'member']) }).parse(req.body);
    const data = await svc.updateProjectMemberRole(req.params.id, req.params.userId, role);
    successResponse(res, data, 'Member role updated');
};
