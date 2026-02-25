import * as projectFilesService from './project-files.service.js';
import { StatusCodes } from 'http-status-codes';

export const getProjectFiles = async (req, res) => {
    const { projectId } = req.params;
    const files = await projectFilesService.getFilesByProject(projectId);
    res.json({ success: true, data: files });
};

export const uploadFile = async (req, res) => {
    const { projectId } = req.params;
    const { filename, file_url, file_type } = req.body;

    const file = await projectFilesService.addFile({
        project_id: projectId,
        filename,
        file_url,
        file_type,
        uploaded_by: req.user.id
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: file });
};

export const removeFile = async (req, res) => {
    const { id } = req.params;
    await projectFilesService.deleteFile(id);
    res.json({ success: true, message: 'File deleted successfully' });
};
