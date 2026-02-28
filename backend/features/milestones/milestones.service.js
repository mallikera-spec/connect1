import { supabaseAdmin } from '../../config/supabase.js';

export const getMilestones = async (projectId) => {
    const { data, error } = await supabaseAdmin
        .from('project_milestones')
        .select('*, creator:profiles!created_by(full_name)')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data;
};

export const createMilestone = async (payload) => {
    const { data, error } = await supabaseAdmin
        .from('project_milestones')
        .insert([payload])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateMilestone = async (id, updates) => {
    const { data, error } = await supabaseAdmin
        .from('project_milestones')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteMilestone = async (id) => {
    const { error } = await supabaseAdmin
        .from('project_milestones')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return true;
};
