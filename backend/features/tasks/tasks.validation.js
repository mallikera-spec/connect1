import { z } from 'zod';

// Matches the tasks table: status (text, default 'pending'), priority (text, default 'medium')
export const createTaskSchema = z.object({
    project_id: z.string().uuid(),
    title: z.string().min(1).regex(/^(?!\d+$).+$/, 'Task title cannot be purely numeric'),
    description: z.string().optional(),
    assigned_to: z.string().uuid().optional(),
    status: z.string().default('pending'),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    estimated_hours: z.coerce.number().positive().optional(),
    actual_hours: z.coerce.number().nonnegative().optional(),
    end_time: z.string().optional(),
    qa_notes: z.string().optional(),
    developer_reply: z.string().optional(),
});

export const updateTaskSchema = z.object({
    title: z.string().min(1).regex(/^(?!\d+$).+$/, 'Task title cannot be purely numeric').optional(),
    description: z.string().optional(),
    assigned_to: z.string().uuid().optional(),
    status: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    estimated_hours: z.coerce.number().positive().optional(),
    actual_hours: z.coerce.number().nonnegative().optional(),
    end_time: z.string().optional(),
    qa_notes: z.string().optional(),
    developer_reply: z.string().optional(),
});
