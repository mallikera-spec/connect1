import { z } from 'zod';

export const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    full_name: z.string().min(1),
    department: z.string().optional(),
    designation: z.string().optional(),
    date_of_joining: z.string().transform(v => v === '' ? null : v).optional(),
});

export const updateUserSchema = z.object({
    full_name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    date_of_joining: z.string().transform(v => v === '' ? null : v).optional(),
});
