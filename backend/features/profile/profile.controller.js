import * as svc from './profile.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { z } from 'zod';

const profileSchema = z.object({
    full_name: z.string().min(1).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    date_of_birth: z.string().transform(v => v === '' ? null : v).optional(),   // ISO date string
    emergency_contact: z.string().optional(),
    bio: z.string().optional(),
    skills: z.array(z.string()).optional(),
    avatar_url: z.string().url().nullish().or(z.literal('')),
    alternate_phone: z.string().optional(),
    blood_group: z.string().optional(),
    education_qualification: z.string().optional(),
    x_year: z.coerce.number().optional().nullish(),
    xii_year: z.coerce.number().optional().nullish(),
    bank_name: z.string().optional(),
    bank_ifsc: z.string().optional(),
    bank_account_no: z.string().optional(),
    pan_number: z.string().optional(),
    aadhar_number: z.string().optional(),
});

const ctcSchema = z.object({ ctc: z.number().nonnegative() });

const adminProfileSchema = profileSchema.extend({
    department: z.string().optional(),
    designation: z.string().optional(),
    date_of_joining: z.string().transform(v => v === '' ? null : v).optional(),
    ctc: z.coerce.number().optional(),
});

export const getMe = async (req, res) => {
    const data = await svc.getMyProfile(req.user.id);
    successResponse(res, data, 'Profile fetched');
};

export const updateMe = async (req, res) => {
    const body = profileSchema.parse(req.body);
    const data = await svc.updateMyProfile(req.user.id, body);
    successResponse(res, data, 'Profile updated');
};

export const getProfile = async (req, res) => {
    const data = await svc.getEmployeeProfile(req.params.userId);
    successResponse(res, data, 'Employee profile fetched');
};

export const updateProfile = async (req, res) => {
    const body = adminProfileSchema.parse(req.body);
    const data = await svc.updateEmployeeProfile(req.params.userId, body);
    successResponse(res, data, 'Employee profile updated');
};

export const setCTC = async (req, res) => {
    const { ctc } = ctcSchema.parse(req.body);
    const data = await svc.updateEmployeeCTC(req.params.userId, ctc);
    successResponse(res, data, 'CTC updated');
};
