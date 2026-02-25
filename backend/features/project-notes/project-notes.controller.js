import * as projectNotesService from './project-notes.service.js';
import { StatusCodes } from 'http-status-codes';

export const getProjectNotes = async (req, res) => {
    const { projectId } = req.params;
    const notes = await projectNotesService.getNotesByProject(projectId);
    res.json({ success: true, data: notes });
};

export const createNote = async (req, res) => {
    const { projectId } = req.params;
    const { content } = req.body;

    const note = await projectNotesService.addNote({
        project_id: projectId,
        content,
        created_by: req.user.id
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: note });
};

export const editNote = async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    const note = await projectNotesService.updateNote(id, content);
    res.json({ success: true, data: note });
};

export const removeNote = async (req, res) => {
    const { id } = req.params;
    await projectNotesService.deleteNote(id);
    res.json({ success: true, message: 'Note deleted successfully' });
};
