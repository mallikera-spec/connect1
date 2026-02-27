import { Router } from 'express';
import * as projectFilesController from './project-files.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import upload from '../../config/multer.js';

const router = Router();

router.use(authMiddleware);

router.get('/project/:projectId', projectFilesController.getProjectFiles);
router.post('/project/:projectId', upload.single('file'), projectFilesController.uploadFile);
router.delete('/:id', projectFilesController.removeFile);

export default router;
