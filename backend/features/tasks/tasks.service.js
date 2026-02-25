import { supabaseAdmin } from '../../config/supabase.js';

export const createTask = async (taskData) => {
    const { data, error } = await supabaseAdmin.from('tasks').insert(taskData).select().single();
    if (error) throw error;
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
    const { data, error } = await supabaseAdmin.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const deleteTask = async (id) => {
    const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id);
    if (error) throw error;
    return { id };
};
