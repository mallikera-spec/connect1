import { supabaseAdmin } from '../../config/supabase.js';

// permissions table columns: id, name, description, created_at
export const createPermission = async (permData) => {
    const { data, error } = await supabaseAdmin.from('permissions').insert(permData).select().single();
    if (error) throw error;
    return data;
};

export const getAllPermissions = async () => {
    const { data, error } = await supabaseAdmin.from('permissions').select('*').order('name');
    if (error) throw error;
    return data;
};

export const deletePermission = async (id) => {
    const { error } = await supabaseAdmin.from('permissions').delete().eq('id', id);
    if (error) throw error;
    return { id };
};
