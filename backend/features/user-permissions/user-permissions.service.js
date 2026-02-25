import { supabaseAdmin } from '../../config/supabase.js';

// user_permissions table: id, user_id, permission_id, created_at

export const getUserPermissions = async (userId) => {
    const { data, error } = await supabaseAdmin
        .from('user_permissions')
        .select('permission:permissions(id, name, description)')
        .eq('user_id', userId);
    if (error) throw error;
    return data.map((up) => up.permission).filter(Boolean);
};

export const assignPermission = async (userId, permissionId) => {
    const { data, error } = await supabaseAdmin
        .from('user_permissions')
        .insert({ user_id: userId, permission_id: permissionId })
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const removePermission = async (userId, permissionId) => {
    const { error } = await supabaseAdmin
        .from('user_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('permission_id', permissionId);
    if (error) throw error;
    return { user_id: userId, permission_id: permissionId };
};
