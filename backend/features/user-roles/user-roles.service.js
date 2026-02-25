import { supabaseAdmin } from '../../config/supabase.js';

export const assignRoleToUser = async ({ user_id, role_id }) => {
    // upsert — silently ignores if this user already has this role
    const { data, error } = await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id, role_id }, { onConflict: 'user_id,role_id', ignoreDuplicates: true })
        .select()
        .maybeSingle();
    if (error) throw error;
    return data ?? { user_id, role_id }; // if ignored, still return the ids
};

export const getUserRoles = async (userId) => {
    const { data, error } = await supabaseAdmin
        .from('user_roles')
        .select('role:roles(id, name, description)')
        .eq('user_id', userId);
    if (error) throw error;
    return data.map((ur) => ur.role).filter(Boolean);
};

export const removeRoleFromUser = async ({ user_id, role_id }) => {
    const { error } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', user_id)
        .eq('role_id', role_id);
    if (error) throw error;
    return { user_id, role_id };
};
