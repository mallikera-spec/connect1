import { Router } from 'express';
import * as tasksController from './tasks.controller.js';
import { addFeedback, getFeedback } from '../qa-feedback/qa-feedback.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { createTaskSchema, updateTaskSchema } from './tasks.validation.js';

const router = Router();

router.use(authMiddleware);

router.post('/', requirePermission('assign_task', ['tester']), validateRequest(createTaskSchema), tasksController.createTask);
router.post('/bulk', requirePermission('assign_task'), tasksController.bulkCreateTasks);
router.patch('/bulk', requirePermission('assign_task'), tasksController.bulkUpdateTasks);
router.delete('/bulk', requirePermission('manage_projects'), tasksController.bulkDeleteTasks);
router.get('/', requirePermission('view_tasks', ['tester']), tasksController.getAllTasks);
router.get('/:id', requirePermission('view_tasks', ['tester']), tasksController.getTaskById);
router.patch('/:id', requirePermission('update_task', ['tester']), validateRequest(updateTaskSchema), tasksController.updateTask);
router.delete('/:id', requirePermission('delete_task'), tasksController.deleteTask);

// Time tracking — nested under tasks
router.post('/:id/start', requirePermission('update_task_status'), tasksController.startTaskTimer);
router.post('/:id/stop', requirePermission('update_task_status'), tasksController.stopTaskTimer);

// QA Feedback
router.post('/:id/feedback', addFeedback('task'));
router.get('/:id/feedback', getFeedback('task'));

export default router;
