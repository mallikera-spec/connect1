import { z } from 'zod';

export const createProjectSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('active'),
    client_name: z.string().optional(),
    client_email: z.string().email().optional().or(z.literal('')),
    client_phone: z.string().optional(),
    sub_types: z.array(z.string()).default([]),
    acquisition_date: z.string().optional(),
});

export const updateProjectSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
    client_name: z.string().optional(),
    client_email: z.string().email().optional().or(z.literal('')),
    client_phone: z.string().optional(),
    sub_types: z.array(z.string()).optional(),
    acquisition_date: z.string().optional(),
});
