import { supabaseAdmin } from '../../config/supabase.js';

export const createRole = async (roleData) => {
    const { data, error } = await supabaseAdmin.from('roles').insert(roleData).select().single();
    if (error) throw error;
    return data;
};

export const getAllRoles = async () => {
    const { data, error } = await supabaseAdmin
        .from('roles')
        .select(`*, role_permissions(permission:permissions(*))`)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const updateRole = async (id, updates) => {
    const { data, error } = await supabaseAdmin.from('roles').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const deleteRole = async (id) => {
    const { error } = await supabaseAdmin.from('roles').delete().eq('id', id);
    if (error) throw error;
    return { id };
};
