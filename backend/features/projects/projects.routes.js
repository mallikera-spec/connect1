import { Router } from 'express';
import {
    createProject, getAllProjects, getProjectById,
    updateProject, deleteProject,
} from './projects.controller.js';
import projectMembersRouter from '../project-members/project-members.routes.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post('/', requirePermission('create_project'), createProject);
router.get('/', requirePermission('view_projects'), getAllProjects);
router.get('/:id', requirePermission('view_projects'), getProjectById);
router.patch('/:id', requirePermission('edit_project'), updateProject);
router.delete('/:id', requirePermission('delete_project'), deleteProject);

// Nested: /projects/:id/members
router.use('/:id/members', projectMembersRouter);

export default router;
