import cloudinary from '../../../config/cloudinary.js';
import { Readable } from 'stream';

/**
 * Uploads a buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer.
 * @param {String} folder - Cloudinary folder name.
 * @param {String} filename - Desired filename.
 * @param {String} resourceType - 'auto' | 'raw' | 'image' | 'video'.
 * @returns {Promise<String>} - Secure URL of the uploaded file.
 */
export const uploadBuffer = async (buffer, folder, filename, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: filename,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          console.error(`[Cloudinary Upload Error] Folder: ${folder}, File: ${filename}`, error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};
