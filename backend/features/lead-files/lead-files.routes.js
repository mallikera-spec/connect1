import express from 'express';
import * as leadFilesController from './lead-files.controller.js';
import upload from '../../config/multer.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/:leadId', leadFilesController.getLeadFiles);
router.post('/:leadId/upload', upload.single('file'), leadFilesController.uploadFile);
router.delete('/:id', leadFilesController.removeFile);

export default router;
