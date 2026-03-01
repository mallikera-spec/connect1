import { Router } from 'express';
import multer from 'multer';
import * as projectNotesController from './project-notes.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

router.use(authMiddleware);

// Any authenticated user can view project notes (developers need this to see todos)
router.get('/project/:projectId', projectNotesController.getProjectNotes);
// Any user with project access can create/edit/delete notes
router.post('/project/:projectId', requirePermission('view_projects'), projectNotesController.createNote);
router.post('/project/:projectId/files', requirePermission('view_projects'), upload.single('file'), projectNotesController.uploadFile);
router.patch('/:id', requirePermission('view_projects'), projectNotesController.editNote);
router.delete('/:id', requirePermission('view_projects'), projectNotesController.removeNote);

export default router;
