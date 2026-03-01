import { Router } from 'express';
import {
    getMyToday, getMyHistory, getAllTimesheets,
    addEntry, updateEntry, deleteEntry,
    getProjectTimesheets
} from './timesheets.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();
router.use(authMiddleware);

// Employee routes
router.get('/me', getMyToday);                          // ?date=YYYY-MM-DD
router.get('/my-history', getMyHistory);

// Project timesheets (Any authenticated user can view)
router.get('/project/:projectId', getProjectTimesheets);

// Entry CRUD
router.post('/:id/entries', addEntry);
router.patch('/entries/:entryId', updateEntry);
router.delete('/entries/:entryId', deleteEntry);

// Admin: view all
router.get('/', requirePermission('view_timesheets'), getAllTimesheets);

export default router;
