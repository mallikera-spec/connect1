import * as milestonesService from './milestones.service.js';
import { StatusCodes } from 'http-status-codes';

export const getMilestones = async (req, res) => {
    const data = await milestonesService.getMilestones(req.params.projectId);
    res.json({ success: true, data });
};

export const createMilestone = async (req, res) => {
    const { title, description, due_date, status } = req.body;
    const data = await milestonesService.createMilestone({
        project_id: req.params.projectId,
        title, description, due_date: due_date || null, status: status || 'pending',
        created_by: req.user.id,
    });
    res.status(StatusCodes.CREATED).json({ success: true, data });
};

export const updateMilestone = async (req, res) => {
    const { title, description, due_date, status } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (due_date !== undefined) updates.due_date = due_date || null;
    if (status !== undefined) updates.status = status;
    const data = await milestonesService.updateMilestone(req.params.id, updates);
    res.json({ success: true, data });
};

export const deleteMilestone = async (req, res) => {
    await milestonesService.deleteMilestone(req.params.id);
    res.json({ success: true, message: 'Milestone deleted' });
};
