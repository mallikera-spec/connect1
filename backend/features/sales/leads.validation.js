import { z } from 'zod';

export const createLeadSchema = z.object({
    name: z.string().min(1, 'Full Name is required').regex(/^(?!\d+$).+$/, 'Name cannot be purely numeric'),
    company: z.string().optional().or(z.literal('')),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    phone: z.string().min(1, 'Phone number is required').regex(/^\+?[0-9\s-]{10,20}$/, 'Invalid phone number format'),
    alt_phone: z.string().optional().or(z.literal('').transform(() => null)).nullable(),
    location: z.string().optional().or(z.literal('')),
    source: z.string().optional(),
    status: z.string().optional(),
    score: z.coerce.number().min(1).max(10).optional(),
    deal_value: z.coerce.number().nonnegative().optional(),
    assigned_agent_id: z.string().uuid().optional().nullable(),
    interaction_note: z.string().optional()
});

export const updateLeadSchema = z.object({
    name: z.string().min(1).regex(/^(?!\d+$).+$/, 'Name cannot be purely numeric').optional(),
    company: z.string().optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().regex(/^\+?[0-9\s-]{10,20}$/, 'Invalid phone number format').optional(),
    alt_phone: z.string().optional().or(z.literal('').transform(() => null)).nullable(),
    location: z.string().optional().or(z.literal('')),
    source: z.string().optional(),
    status: z.string().optional(),
    score: z.coerce.number().min(1).max(10).optional(),
    deal_value: z.coerce.number().nonnegative().optional(),
    assigned_agent_id: z.string().uuid().optional().nullable()
});
