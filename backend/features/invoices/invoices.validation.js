import { z } from 'zod';

export const invoiceSchema = z.object({
    client_id: z.string().uuid().optional().nullable(),
    project_id: z.string().uuid().optional().nullable(),
    client_company_name: z.string().optional().nullable(),
    client_address: z.string().optional().nullable(),
    client_city: z.string().optional().nullable(),
    client_state: z.string().optional().nullable(),
    client_zip: z.string().optional().nullable(),
    client_contact_name: z.string().optional().nullable(),
    client_email: z.string().email().optional().nullable(),
    client_phone: z.string().optional().nullable(),
    client_gstin: z.string().optional().nullable(),
    client_pan: z.string().optional().nullable(),
    company_gstin: z.string().optional().nullable(),
    company_pan: z.string().optional().nullable(),
    issue_date: z.string(), // ISO date string
    due_date: z.string(),   // ISO date string
    currency: z.string().max(10).default('INR'),
    subtotal: z.coerce.number().nonnegative(),
    tax_rate: z.coerce.number().nonnegative().default(0),
    tax_amount: z.coerce.number().nonnegative(),
    discount_amount: z.coerce.number().nonnegative().default(0),
    total_amount: z.coerce.number().nonnegative(),
    notes: z.string().optional().nullable(),
    terms_and_conditions: z.string().optional().nullable(),
    status: z.enum(['draft', 'sent', 'paid', 'void', 'partially_paid']).default('draft'),
    items: z.array(z.object({
        description: z.string().min(1),
        quantity: z.coerce.number().gt(0),
        unit_price: z.coerce.number().nonnegative(),
        total: z.coerce.number().nonnegative()
    })).min(1)
});

export const updateStatusSchema = z.object({
    status: z.enum(['draft', 'sent', 'paid', 'void', 'partially_paid'])
});
