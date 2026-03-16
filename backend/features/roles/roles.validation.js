import { z } from 'zod';

export const createRoleSchema = z.object({
    name: z.string().min(1).regex(/^(?!\d+$).+$/, 'Role name cannot be purely numeric'),
    description: z.string().optional(),
});

export const updateRoleSchema = z.object({
    name: z.string().min(1).regex(/^(?!\d+$).+$/, 'Role name cannot be purely numeric').optional(),
    description: z.string().optional(),
});
