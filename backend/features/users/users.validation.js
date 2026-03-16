import { z } from 'zod';

export const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    full_name: z.string().min(1).regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces'),
    department: z.string().optional(),
    designation: z.string().optional(),
    date_of_joining: z.string().transform(v => v === '' ? null : v).optional(),
});

export const updateUserSchema = z.object({
    full_name: z.string().min(1).regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces').optional(),
    email: z.string().email().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    date_of_joining: z.string().transform(v => v === '' ? null : v).optional(),
    joining_date: z.string().transform(v => v === '' ? null : v).optional(),
    base_salary: z.coerce.number().optional(),
    ctc: z.coerce.number().optional(),
});
