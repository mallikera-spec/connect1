import { supabaseAdmin } from '../../config/supabase.js';

export const getAuthUser = async (user) => {
  // Fetch profile to get avatar_url
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions,
    avatar_url: profile?.avatar_url || null,
  };
};

export const fetchUserPermissions = async (userId) => {
  const { data: userRoles, error } = await supabaseAdmin
    .from('user_roles')
    .select(`
      role:roles (
        id,
        name,
        role_permissions (
          permission:permissions (
            id,
            name
          )
        )
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;

  const roles = userRoles?.map((ur) => ur.role?.name).filter(Boolean) ?? [];
  const permissions = userRoles
    ?.flatMap((ur) => ur.role?.role_permissions ?? [])
    .map((rp) => rp.permission?.name)
    .filter(Boolean) ?? [];

  return {
    roles,
    permissions: [...new Set(permissions)],
  };
};
