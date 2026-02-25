import { StatusCodes } from 'http-status-codes';

/**
 * Send a standardized success response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message]
 * @param {number} [statusCode]
 */
export const successResponse = (
    res,
    data,
    message = 'Success',
    statusCode = StatusCodes.OK
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

/**
 * Send a standardized error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode]
 */
export const errorResponse = (
    res,
    message = 'An error occurred',
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR
) => {
    return res.status(statusCode).json({
        success: false,
        message,
    });
};
