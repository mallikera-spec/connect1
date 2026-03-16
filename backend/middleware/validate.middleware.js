export const validateRequest = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync(req.body);
        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: error.errors?.map(e => ({
                field: e.path.join('.'),
                message: e.message
            })) || error.message
        });
    }
};
