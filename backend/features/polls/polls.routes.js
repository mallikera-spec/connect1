import express from 'express';
import * as pollsController from './polls.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = express.Router();

router.use(authMiddleware);

// Employee routes
router.get('/', pollsController.getActivePolls);
router.post('/vote', pollsController.vote);

// Admin / HR routes
router.post('/', requirePermission('view_employees'), pollsController.createPoll);
router.get('/:id/results', requirePermission('view_employees'), pollsController.getPollResults);
router.patch('/:id/close', requirePermission('view_employees'), pollsController.closePoll);

export default router;
