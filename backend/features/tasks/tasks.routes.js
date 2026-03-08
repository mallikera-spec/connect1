import { Router } from 'express';
import {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask,
    startTaskTimer,
    stopTaskTimer,
} from './tasks.controller.js';
import { addFeedback, getFeedback } from '../qa-feedback/qa-feedback.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', requirePermission('assign_task', ['tester']), createTask);
router.get('/', requirePermission('view_tasks', ['tester']), getAllTasks);
router.get('/:id', requirePermission('view_tasks', ['tester']), getTaskById);
router.patch('/:id', requirePermission('update_task', ['tester']), updateTask);
router.delete('/:id', requirePermission('delete_task', ['tester']), deleteTask);

// Time tracking — nested under tasks
router.post('/:id/start', requirePermission('update_task_status'), startTaskTimer);
router.post('/:id/stop', requirePermission('update_task_status'), stopTaskTimer);

// QA Feedback
router.post('/:id/feedback', addFeedback('task'));
router.get('/:id/feedback', getFeedback('task'));

export default router;
