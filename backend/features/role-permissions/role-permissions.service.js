import { supabaseAdmin } from '../../config/supabase.js';

export const assignPermissionToRole = async ({ role_id, permission_id }) => {
    const { data, error } = await supabaseAdmin
        .from('role_permissions')
        .insert({ role_id, permission_id })
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const removePermissionFromRole = async ({ role_id, permission_id }) => {
    const { error } = await supabaseAdmin
        .from('role_permissions')
        .delete()
        .eq('role_id', role_id)
        .eq('permission_id', permission_id);
    if (error) throw error;
    return { role_id, permission_id };
};
