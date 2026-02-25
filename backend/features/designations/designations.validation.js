import { z } from 'zod';

export const createDesignationSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    department_id: z.string().uuid().optional(), // optionally tied to a department
});

export const updateDesignationSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    department_id: z.string().uuid().nullable().optional(),
});
