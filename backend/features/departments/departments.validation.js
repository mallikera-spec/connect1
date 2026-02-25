import { z } from 'zod';

export const createDepartmentSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
});
