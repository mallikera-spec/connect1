import { supabaseAdmin } from '../../config/supabase.js';

export const createProject = async (projectData, createdBy) => {
    const { data, error } = await supabaseAdmin
        .from('projects')
        .insert({ ...projectData, created_by: createdBy })
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const getAllProjects = async (options = {}) => {
    let query = supabaseAdmin
        .from('projects')
        .select(`
            *,
            creator:profiles!created_by(id, full_name, email),
            project_members(
                id, role,
                user:profiles(id, full_name, email)
            )
        `);

    if (options.memberUserId) {
        // Fetch project IDs where user is a member
        const { data: memberOf } = await supabaseAdmin
            .from('project_members')
            .select('project_id')
            .eq('user_id', options.memberUserId);

        const projectIds = memberOf?.map(m => m.project_id) || [];

        if (projectIds.length > 0) {
            // Filter: Created by user OR in member projects
            query = query.or(`created_by.eq.${options.memberUserId},id.in.(${projectIds.join(',')})`);
        } else {
            // Filter: Only created by user
            query = query.eq('created_by', options.memberUserId);
        }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const getProjectById = async (id) => {
    const { data, error } = await supabaseAdmin
        .from('projects')
        .select(`
            *,
            creator:profiles!created_by(id, full_name, email),
            project_members(
                id, role,
                user:profiles(id, full_name, email)
            )
        `)
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
};

export const updateProject = async (id, updates) => {
    const { data, error } = await supabaseAdmin
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteProject = async (id) => {
    const { error } = await supabaseAdmin.from('projects').delete().eq('id', id);
    if (error) throw error;
    return { id };
};
