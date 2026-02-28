import * as projectNotesService from './project-notes.service.js';
import { StatusCodes } from 'http-status-codes';

export const getProjectNotes = async (req, res) => {
    const { projectId } = req.params;
    const notes = await projectNotesService.getNotesByProject(projectId);
    res.json({ success: true, data: notes });
};

export const createNote = async (req, res) => {
    const { projectId } = req.params;
    const { content, type = 'meeting', title, meta } = req.body;

    const note = await projectNotesService.addNote({
        project_id: projectId,
        content,
        type,
        title: title || null,
        meta: meta || null,
        created_by: req.user.id
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: note });
};

export const editNote = async (req, res) => {
    const { id } = req.params;
    const { content, title, meta } = req.body;
    const updates = {};
    if (content !== undefined) updates.content = content;
    if (title !== undefined) updates.title = title;
    if (meta !== undefined) updates.meta = meta;
    const note = await projectNotesService.updateNote(id, updates);
    res.json({ success: true, data: note });
};

export const removeNote = async (req, res) => {
    const { id } = req.params;
    await projectNotesService.deleteNote(id);
    res.json({ success: true, message: 'Note deleted successfully' });
};
