import { StatusCodes } from 'http-status-codes';

/**
 * Factory function — returns an Express middleware that checks
 * if req.user has the required permission.
 * Must be used AFTER authMiddleware.
 *
 * ✅ Super-admin bypass: users with role 'super_admin' skip all permission checks.
 */
export const requirePermission = (permissionName) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        // Super-admin bypasses all permission checks
        if (req.user.roles?.includes('super_admin')) {
            return next();
        }

        if (!req.user.permissions?.includes(permissionName)) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: `Forbidden: missing permission '${permissionName}'`,
            });
        }

        next();
    };
};
