import { z } from 'zod';

export const createDepartmentSchema = z.object({
    name: z.string().min(1).regex(/^(?!\d+$).+$/, 'Department name cannot be purely numeric'),
    description: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
    name: z.string().min(1).regex(/^(?!\d+$).+$/, 'Department name cannot be purely numeric').optional(),
    description: z.string().optional(),
});
