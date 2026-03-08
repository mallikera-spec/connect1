import { StatusCodes } from 'http-status-codes';

/**
 * Factory function — returns an Express middleware that checks
 * if req.user has the required permission.
 * Must be used AFTER authMiddleware.
 *
 * ✅ Super-admin bypass: users with role 'super_admin' skip all permission checks.
 */
export const requirePermission = (permissionName, allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        // Super-admin / Director bypasses all permission checks
        const isSuperAdmin = req.user.roles?.some(r => ['super_admin', 'super admin', 'director'].includes(r.toLowerCase()));
        if (isSuperAdmin) return next();

        // Check if user has explicit permission
        const hasPerm = req.user.permissions?.includes(permissionName);
        if (hasPerm) return next();

        // Check if user has an allowed role
        if (allowedRoles.length > 0) {
            const hasRoleMatch = allowedRoles.some(role =>
                req.user.roles?.some(userRole => userRole.toLowerCase() === role.toLowerCase())
            );
            if (hasRoleMatch) return next();
        }

        return res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            message: `Forbidden: missing permission '${permissionName}'`,
        });
    };
};
