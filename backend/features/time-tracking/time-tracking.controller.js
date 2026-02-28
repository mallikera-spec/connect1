import * as timeTrackingService from './time-tracking.service.js';

export const startTimer = async (req, res, next) => {
    try {
        const { taskId } = req.body;
        const data = await timeTrackingService.startTimer(taskId, req.user.id);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const stopTimer = async (req, res, next) => {
    try {
        const { taskId } = req.body;
        const data = await timeTrackingService.stopTimer(taskId, req.user.id);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
