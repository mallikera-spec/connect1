import * as svc from './qa-feedback.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

const feedbackSchema = z.object({
    content: z.string().min(1),
    new_status: z.string().optional(),
});

export const addFeedback = (item_type) => async (req, res) => {
    const { content, new_status } = feedbackSchema.parse(req.body);
    const itemId = req.params.itemId || req.params.id || req.params.entryId;

    const data = await svc.createFeedback({
        item_type,
        item_id: itemId,
        author_id: req.user.id,
        content,
        new_status
    });

    successResponse(res, data, 'Feedback added', StatusCodes.CREATED);
};

export const getFeedback = (item_type) => async (req, res) => {
    const itemId = req.params.itemId || req.params.id || req.params.entryId;
    const data = await svc.getFeedbackForItem(item_type, itemId);
    successResponse(res, data, 'Feedback fetched');
};
