import { supabaseAdmin } from '../../config/supabase.js';
import { createNotification } from '../notifications/notifications.service.js';

export const createTask = async (taskData) => {
    const { data, error } = await supabaseAdmin.from('tasks').insert(taskData).select().single();
    if (error) throw error;

    // Notify assignee
    if (data.assigned_to) {
        try {
            await createNotification({
                userId: data.assigned_to,
                type: 'TASK_ASSIGNED',
                title: 'New Task Assigned',
                message: `You have been assigned to: ${data.title}`,
                data: { taskId: data.id }
            });
        } catch (err) {
            console.error('Failed to create notification:', err);
        }
    }

    return data;
};

export const getAllTasks = async (filters = {}) => {
    let query = supabaseAdmin
        .from('tasks')
        .select('id, title, description, status, priority, estimated_hours, actual_hours, start_time, end_time, created_at, project:projects(id, name), assignee:profiles!assigned_to(id, full_name, email)')
        .order('created_at', { ascending: false });

    if (filters.project_id) query = query.eq('project_id', filters.project_id);
    if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) {
        const end = filters.endDate.includes('T') ? filters.endDate : `${filters.endDate} 23:59:59.999`;
        query = query.lte('created_at', end);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const getTaskById = async (id) => {
    const { data, error } = await supabaseAdmin
        .from('tasks')
        .select('id, title, description, status, priority, estimated_hours, actual_hours, start_time, end_time, created_at, project:projects(id, name), assignee:profiles!assigned_to(id, full_name, email)')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
};

export const updateTask = async (id, updates) => {
    // Get original task to check for assignment change
    const { data: oldTask } = await supabaseAdmin.from('tasks').select('assigned_to, title').eq('id', id).single();

    const { data, error } = await supabaseAdmin.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;

    // Notify if assignment changed or updated
    if (data.assigned_to && data.assigned_to !== oldTask?.assigned_to) {
        try {
            await createNotification({
                userId: data.assigned_to,
                type: 'TASK_ASSIGNED',
                title: 'New Task Assigned',
                message: `You have been assigned to: ${data.title}`,
                data: { taskId: data.id }
            });
        } catch (err) {
            console.error('Failed to create notification:', err);
        }
    } else if (data.assigned_to) {
        // Just an update to an existing assignment
        try {
            await createNotification({
                userId: data.assigned_to,
                type: 'TASK_UPDATED',
                title: 'Task Updated',
                message: `Task updated: ${data.title}`,
                data: { taskId: data.id }
            });
        } catch (err) {
            console.error('Failed to create notification:', err);
        }
    }

    return data;
};

export const deleteTask = async (id) => {
    const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id);
    if (error) throw error;
    return { id };
};
