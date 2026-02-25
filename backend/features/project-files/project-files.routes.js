import { Router } from 'express';
import * as projectFilesController from './project-files.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/project/:projectId', requirePermission('view_project_files'), projectFilesController.getProjectFiles);
router.post('/project/:projectId', requirePermission('manage_project_files'), projectFilesController.uploadFile);
router.delete('/:id', requirePermission('manage_project_files'), projectFilesController.removeFile);

export default router;
