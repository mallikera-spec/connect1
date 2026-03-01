import { z } from 'zod';

// Matches the tasks table: status (text, default 'pending'), priority (text, default 'medium')
export const createTaskSchema = z.object({
    project_id: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional(),
    assigned_to: z.string().uuid().optional(),
    status: z.string().default('pending'),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    estimated_hours: z.number().positive().optional(),
    actual_hours: z.number().nonnegative().optional(),
    end_time: z.string().optional(),
});

export const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    assigned_to: z.string().uuid().optional(),
    status: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    estimated_hours: z.number().positive().optional(),
    actual_hours: z.number().nonnegative().optional(),
    end_time: z.string().optional(),
});
