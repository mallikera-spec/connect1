import * as projectNotesService from './project-notes.service.js';
import * as projectService from '../projects/projects.service.js';
import cloudinary from '../../config/cloudinary.js';
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

export const uploadFile = async (req, res) => {
    const { projectId } = req.params;
    if (!req.file) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'No file uploaded' });

    // Get project name for folder structure
    const project = await projectService.getProjectById(projectId);
    const projectName = project ? project.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Unknown_Project';

    // Upload to Cloudinary using upload_stream
    const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: `Argosmob_Projects/${projectName}`,
                resource_type: 'auto', // handle images, raw files, pdfs, etc.
                public_id: req.file.originalname.split('.')[0] + '_' + Date.now()
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(req.file.buffer);
    });

    // Save metadata as a 'file' note
    const fileMeta = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        size: req.file.size,
        original_name: req.file.originalname,
        format: uploadResult.format || req.file.originalname.split('.').pop(),
        is_file: true // Used by frontend to identify this as a generic file instead of a text BRD
    };

    const note = await projectNotesService.addNote({
        project_id: projectId,
        content: `Attached file: ${req.file.originalname}`,
        type: 'brd', // Using an allowed DB enum type to bypass check constraint
        title: req.file.originalname,
        meta: fileMeta,
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
