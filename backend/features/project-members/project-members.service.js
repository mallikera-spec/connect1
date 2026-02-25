import { supabaseAdmin } from '../../config/supabase.js';

export const getProjectMembers = async (projectId) => {
    const { data, error } = await supabaseAdmin
        .from('project_members')
        .select(`
            id, role, created_at,
            user:profiles(id, full_name, email, department, designation)
        `)
        .eq('project_id', projectId)
        .order('created_at');
    if (error) throw error;
    return data;
};

export const addProjectMember = async (projectId, { user_id, role = 'member' }) => {
    const { data, error } = await supabaseAdmin
        .from('project_members')
        .upsert({ project_id: projectId, user_id, role }, { onConflict: 'project_id,user_id' })
        .select(`id, role, user:profiles(id, full_name, email)`)
        .single();
    if (error) throw error;
    return data;
};

export const removeProjectMember = async (projectId, userId) => {
    const { error } = await supabaseAdmin
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);
    if (error) throw error;
    return { project_id: projectId, user_id: userId };
};

export const updateProjectMemberRole = async (projectId, userId, role) => {
    const { data, error } = await supabaseAdmin
        .from('project_members')
        .update({ role })
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .select()
        .single();
    if (error) throw error;
    return data;
};
