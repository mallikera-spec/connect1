import multer from 'multer';

// Use memory storage to handle the file buffer before uploading to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
});

export default upload;
