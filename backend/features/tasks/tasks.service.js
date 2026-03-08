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
        .select('id, title, description, status, priority, estimated_hours, actual_hours, start_time, end_time, created_at, qa_notes, developer_reply, project:projects(id, name), assignee:profiles!assigned_to(id, full_name, email)')
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
        .select('id, title, description, status, priority, estimated_hours, actual_hours, start_time, end_time, created_at, qa_notes, developer_reply, project:projects(id, name), assignee:profiles!assigned_to(id, full_name, email)')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
};

export const updateTask = async (id, updates, user) => {
    // 1. Get current task state
    const { data: currentTask, error: fetchError } = await supabaseAdmin
        .from('tasks')
        .select('*, assignee:profiles!assigned_to(id, full_name, email)')
        .eq('id', id)
        .single();

    if (fetchError || !currentTask) throw new Error('Task not found');

    // 2. Implement Locking Logic
    const isAdmin = user?.roles?.some(r =>
        ['super_admin', 'super admin', 'director', 'project_manager', 'project manager', 'hr', 'hr manager', 'tester'].includes(r.toLowerCase())
    );

    const isDeveloper = currentTask.assigned_to === user?.id;
    const lockedStatuses = ['done', 'ready_for_qa', 'verified'];

    if (!isAdmin && isDeveloper && lockedStatuses.includes(currentTask.status)) {
        // If developer is trying to edit a locked task
        // Exception: Allow them to update status to 'done' or 'ready_for_qa' if it was 'failed' (resubmission)
        const isResubmitting = currentTask.status === 'failed' && (updates.status === 'done' || updates.status === 'ready_for_qa');

        if (!isResubmitting) {
            throw new Error(`Task is locked in ${currentTask.status} status. You cannot edit it.`);
        }
    }

    // 3. Perform Update
    const { data, error } = await supabaseAdmin
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select('*, project:projects(id, name), assignee:profiles!assigned_to(id, full_name, email)')
        .single();

    if (error) throw error;

    // 4. Notifications (Assignment or Status Change)
    if (data.assigned_to && data.assigned_to !== currentTask?.assigned_to) {
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
        try {
            const isFailed = updates.status === 'failed';
            const isVerified = updates.status === 'verified';

            await createNotification({
                userId: data.assigned_to,
                type: isFailed ? 'TASK_FAILED' : isVerified ? 'TASK_VERIFIED' : 'TASK_UPDATED',
                title: isFailed ? 'Task Failed QA' : isVerified ? 'Task Verified' : 'Task Updated',
                message: isFailed
                    ? `QA failed for: ${data.title}. Check notes.`
                    : isVerified
                        ? `Task verified by QA: ${data.title}`
                        : `Task updated: ${data.title}`,
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
