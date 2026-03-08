import { z } from 'zod';

export const createProjectSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional().nullable(),
    status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('active'),
    client_name: z.string().optional().nullable(),
    client_email: z.string().email().optional().nullable().or(z.literal('')),
    client_phone: z.string().optional().nullable(),
    client_alt_phone: z.string().optional().nullable(),
    sub_types: z.array(z.string()).default([]),
    acquisition_date: z.string().optional().nullable(),
    days_committed: z.coerce.number().int().min(0).optional().default(0),
    due_date: z.string().optional().nullable().or(z.literal('')),
});

export const updateProjectSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
    client_name: z.string().optional().nullable(),
    client_email: z.string().email().optional().nullable().or(z.literal('')),
    client_phone: z.string().optional().nullable(),
    client_alt_phone: z.string().optional().nullable(),
    sub_types: z.array(z.string()).optional(),
    acquisition_date: z.string().optional().nullable(),
    days_committed: z.coerce.number().int().min(0).optional(),
    due_date: z.string().optional().nullable().or(z.literal('')),
});
