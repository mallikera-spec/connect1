import { z } from 'zod';

export const createClientSchema = z.object({
    company_name: z.string().min(1, 'Company name is required'),
    contact_name: z.string().optional(),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    alt_phone: z.string().optional().or(z.literal('')),
    status: z.enum(['Active', 'Inactive', 'Archived']).optional(),
    lead_id: z.string().uuid().optional().nullable(),
    deal_value: z.number().optional().nullable()
});

export const updateClientSchema = z.object({
    company_name: z.string().min(1).optional(),
    contact_name: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    alt_phone: z.string().optional().or(z.literal('')),
    status: z.enum(['Active', 'Inactive', 'Archived']).optional(),
    deal_value: z.number().optional().nullable()
});
