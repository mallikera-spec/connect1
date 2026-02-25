import { ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';

// eslint-disable-next-line no-unused-vars
export const errorMiddleware = (err, _req, res, _next) => {
    console.error('❌ Error:', err);

    // Zod validation error
    if (err instanceof ZodError) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            success: false,
            message: 'Validation error',
            errors: err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
    }

    // Known operational errors with statusCode
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }

    // Generic fallback
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'Internal server error',
    });
};
