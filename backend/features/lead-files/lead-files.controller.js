import * as leadFilesService from './lead-files.service.js';
import * as salesService from '../sales/sales.service.js';
import { StatusCodes } from 'http-status-codes';
import cloudinary from '../../config/cloudinary.js';

export const getLeadFiles = async (req, res) => {
    const { leadId } = req.params;
    console.log(`[LeadFiles] Fetching files for lead: ${leadId}`);
    try {
        const files = await leadFilesService.getFilesByLead(leadId);
        res.json({ success: true, data: files });
    } catch (error) {
        console.error(`[LeadFiles] Error fetching files:`, error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
};

export const uploadFile = async (req, res) => {
    const { leadId } = req.params;
    const { filename: customFilename, file_type } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'No file uploaded' });
    }

    try {
        console.log(`[LeadFiles] Uploading file for lead: ${leadId}`);
        // 1. Get lead details
        const lead = await salesService.getLeadById(leadId);
        if (!lead) {
            console.warn(`[LeadFiles] Lead ${leadId} not found`);
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Lead not found' });
        }

        // 2. Upload to Cloudinary using buffer
        const uploadFromBuffer = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const originalName = file.originalname;
                const extension = originalName.includes('.') ? originalName.split('.').pop().toLowerCase() : '';

                // Determine resource_type for Cloudinary
                // const isImage = ['jpg', 'jpeg', 'png', 'svg', 'webp', 'gif'].includes(extension);
                // const isPdf = extension === 'pdf';
                // const resourceType = isImage || isPdf ? 'image' : 'raw';

                // Generate public_id
                const baseName = (customFilename || originalName).split('.').slice(0, -1).join('.') || (customFilename || originalName);
                const sanitizedBase = baseName.replace(/[^a-zA-Z0-9]/g, '_');

                // For maximum reliability, we'll ALWAYS include the extension in the public_id
                // Cloudinary 'auto' will determine the resource_type
                const publicId = `${sanitizedBase}_${Date.now()}${extension ? '.' + extension : ''}`;

                console.log(`[LeadFiles] Uploading: ${originalName} with public_id: ${publicId}`);

                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: `connect/leads/${leadId}`,
                        resource_type: 'auto',
                        public_id: publicId,
                        use_filename: true,
                        unique_filename: true,
                    },
                    (error, result) => {
                        if (error) {
                            console.error(`[LeadFiles] Cloudinary error:`, error);
                            return reject(error);
                        }
                        resolve(result);
                    }
                );
                uploadStream.end(fileBuffer);
            });
        };

        const cloudinaryResult = await uploadFromBuffer(file.buffer);
        console.log(`[LeadFiles] Cloudinary response:`, {
            public_id: cloudinaryResult.public_id,
            resource_type: cloudinaryResult.resource_type,
            secure_url: cloudinaryResult.secure_url
        });
        console.log(`[LeadFiles] Successfully uploaded to Cloudinary: ${cloudinaryResult.secure_url}`);

        // 3. Save metadata to Supabase
        const savedFile = await leadFilesService.addFile({
            lead_id: leadId,
            filename: customFilename || file.originalname,
            file_url: cloudinaryResult.secure_url,
            file_type: file_type || 'Other',
            uploaded_by: req.user.id
        });

        res.status(StatusCodes.CREATED).json({ success: true, data: savedFile });
    } catch (error) {
        console.error('Lead file upload error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
};

export const removeFile = async (req, res) => {
    const { id } = req.params;
    console.log(`[LeadFiles] Deletion request for file id: ${id}`);
    try {
        await leadFilesService.deleteFile(id);
        console.log(`[LeadFiles] File ${id} metadata deleted from Supabase`);
        res.json({ success: true, message: 'File deleted successfully' });
    } catch (error) {
        console.error(`[LeadFiles] Error deleting file ${id}:`, error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
};
