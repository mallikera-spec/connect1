import { z } from 'zod';

export const generateSchema = z.object({
  formData: z.object({
    project_name: z.string().min(1, 'Project name is required'),
    client_name: z.string().min(1, 'Client name is required'),
    client_email: z.string().email('Valid client email is required'),
    project_start_date: z.string().optional().nullable(),
    project_description: z.string().optional().nullable(),
    business_goals: z.string().optional().nullable(),
    user_personas: z.string().optional().nullable(),
    tech_stack: z.string().optional().nullable(),
    core_modules: z.string().optional().nullable(),
    estimated_budget: z.string().optional().nullable(),
    tentative_timeline: z.string().optional().nullable(),
    payment_terms: z.string().optional().nullable(),
    assumptions: z.string().optional().nullable(),
    out_of_scope: z.string().optional().nullable(),
  })
});

export const updateSchema = z.object({
  project_name: z.string().optional(),
  client_name: z.string().optional(),
  status: z.enum(['draft', 'finalized', 'sent']).optional(),
  sow_data: z.record(z.any()).optional(),
  dev_tasks: z.array(z.record(z.any())).optional(),
  qa_tasks: z.array(z.record(z.any())).optional(),
  deployment_tasks: z.array(z.record(z.any())).optional(),
});
