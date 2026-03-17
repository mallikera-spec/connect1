import { StatusCodes } from 'http-status-codes';

const CFO_EMAILS = ['admin@argosmob.com', 'chandan@argosmob.com'];

/**
 * Middleware to restrict Finance sensitive operations (Edit/Delete)
 * Only Chandan Mallik (CFO) or the designated admin accounts can execute these.
 */
export const financeAuthMiddleware = (req, res, next) => {
    const user = req.user;

    if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: 'Authentication required'
        });
    }

    // Restrict only PUT and DELETE methods for finance records
    if (['PUT', 'DELETE'].includes(req.method)) {
        const isCFO = CFO_EMAILS.includes(user.email.toLowerCase());

        if (!isCFO) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: 'Access Denied: Only the CFO (Chandan Mallik) has permissions to edit or delete finance records.'
            });
        }
    }

    next();
};
