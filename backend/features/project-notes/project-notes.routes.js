import { Router } from 'express';
import * as projectNotesController from './project-notes.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/project/:projectId', requirePermission('view_project_notes'), projectNotesController.getProjectNotes);
router.post('/project/:projectId', requirePermission('manage_project_notes'), projectNotesController.createNote);
router.patch('/:id', requirePermission('manage_project_notes'), projectNotesController.editNote);
router.delete('/:id', requirePermission('manage_project_notes'), projectNotesController.removeNote);

export default router;
