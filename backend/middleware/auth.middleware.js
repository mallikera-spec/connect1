import { StatusCodes } from 'http-status-codes';
import { supabaseAnon, supabaseAdmin } from '../config/supabase.js';

export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: 'Missing or invalid Authorization header',
        });
    }

    const token = authHeader.split(' ')[1];

    // 1. Verify JWT with Supabase
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (error || !user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }

    // 2. Fetch role-based permissions
    const { data: userRoles, error: rolesError } = await supabaseAdmin
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
        .eq('user_id', user.id);

    if (rolesError) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch user roles',
        });
    }

    // 3. Fetch direct user permissions (user_permissions table)
    const { data: directPerms } = await supabaseAdmin
        .from('user_permissions')
        .select('permission:permissions(id, name)')
        .eq('user_id', user.id);

    // 4. Flatten and deduplicate
    const roles = userRoles?.map((ur) => ur.role?.name).filter(Boolean) ?? [];

    const rolePermissions = userRoles
        ?.flatMap((ur) => ur.role?.role_permissions ?? [])
        .map((rp) => rp.permission?.name)
        .filter(Boolean) ?? [];

    const userDirectPermissions = (directPerms ?? [])
        .map((up) => up.permission?.name)
        .filter(Boolean);

    req.user = {
        id: user.id,
        email: user.email,
        roles,
        permissions: [...new Set([...rolePermissions, ...userDirectPermissions])],
    };

    next();
};
