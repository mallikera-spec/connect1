import { z } from 'zod';

export const createDesignationSchema = z.object({
    name: z.string().min(1).regex(/^(?!\d+$).+$/, 'Designation name cannot be purely numeric'),
    description: z.string().optional(),
    department_id: z.string().uuid().optional(), // optionally tied to a department
});

export const updateDesignationSchema = z.object({
    name: z.string().min(1).regex(/^(?!\d+$).+$/, 'Designation name cannot be purely numeric').optional(),
    description: z.string().optional(),
    department_id: z.string().uuid().nullable().optional(),
});
