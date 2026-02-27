import * as projectFilesService from './project-files.service.js';
import * as projectsService from '../projects/projects.service.js';
import { StatusCodes } from 'http-status-codes';
import cloudinary from '../../config/cloudinary.js';

export const getProjectFiles = async (req, res) => {
    const { projectId } = req.params;
    const files = await projectFilesService.getFilesByProject(projectId);
    res.json({ success: true, data: files });
};

export const uploadFile = async (req, res) => {
    const { projectId } = req.params;
    const { filename: customFilename, file_type } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'No file uploaded' });
    }

    // 1. Get project details for folder name and permission check
    const project = await projectsService.getProjectById(projectId);
    if (!project) {
        return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Project not found' });
    }

    const isSuperAdmin = req.user.roles?.includes('super_admin');
    const isProjectMember = project.project_members.some(m => m.user.id === req.user.id);

    if (!isSuperAdmin && !isProjectMember) {
        return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: 'Forbidden: You are not assigned to this project' });
    }

    const folderName = project.name.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitize folder name

    // 2. Upload to Cloudinary using buffer
    const uploadFromBuffer = (fileBuffer) => {
        return new Promise((resolve, reject) => {
            // Include original extension in public_id to ensure Cloudinary treats 'raw' files (PDF, ZIP, etc.) correctly
            const originalName = file.originalname;
            const extension = originalName.includes('.') ? originalName.split('.').pop() : '';

            // Generate a unique filename while preserving extension
            const baseName = (customFilename || originalName).split('.').slice(0, -1).join('.') || (customFilename || originalName);
            const publicId = `${baseName}_${Date.now()}${extension ? '.' + extension : ''}`;

            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `projects/${folderName}`,
                    resource_type: 'auto',
                    public_id: publicId,
                    use_filename: true,
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            uploadStream.end(fileBuffer);
        });
    };

    const cloudinaryResult = await uploadFromBuffer(file.buffer);

    // 3. Save metadata to Supabase
    const savedFile = await projectFilesService.addFile({
        project_id: projectId,
        filename: customFilename || file.originalname,
        file_url: cloudinaryResult.secure_url,
        file_type: file_type || 'Other',
        uploaded_by: req.user.id
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: savedFile });
};

export const removeFile = async (req, res) => {
    const { id } = req.params;
    await projectFilesService.deleteFile(id);
    res.json({ success: true, message: 'File deleted successfully' });
};
