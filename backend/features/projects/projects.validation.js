import { z } from 'zod';

export const createProjectSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    // Note: no 'status' column in projects table
});

export const updateProjectSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
});
