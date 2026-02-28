import express from 'express';
import * as timeTrackingController from './time-tracking.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/start', timeTrackingController.startTimer);
router.post('/stop', timeTrackingController.stopTimer);

export default router;
