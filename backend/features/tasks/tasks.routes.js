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
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', requirePermission('assign_task'), createTask);
router.get('/', requirePermission('view_tasks'), getAllTasks);
router.get('/:id', requirePermission('view_tasks'), getTaskById);
router.patch('/:id', requirePermission('update_task'), updateTask);
router.delete('/:id', requirePermission('delete_task'), deleteTask);

// Time tracking — nested under tasks
router.post('/:id/start', requirePermission('update_task_status'), startTaskTimer);
router.post('/:id/stop', requirePermission('update_task_status'), stopTaskTimer);

export default router;
