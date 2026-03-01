import * as pollsService from './polls.service.js';

export const createPoll = async (req, res, next) => {
    try {
        const data = await pollsService.createPoll(req.user.id, req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getActivePolls = async (req, res, next) => {
    try {
        const data = await pollsService.getPollsForUser(req.user.id);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const vote = async (req, res, next) => {
    try {
        const { pollId, optionId } = req.body;
        const data = await pollsService.vote(req.user.id, pollId, optionId);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getPollResults = async (req, res, next) => {
    try {
        const data = await pollsService.getPollResults(req.params.id);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const closePoll = async (req, res, next) => {
    try {
        const data = await pollsService.closePoll(req.params.id, req.user.id);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
