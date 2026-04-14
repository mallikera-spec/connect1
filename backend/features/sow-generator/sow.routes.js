import express from 'express';
import * as sowController from './sow.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateRequest as validate } from '../../middleware/validate.middleware.js';
import * as sowValidator from './sow.validator.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Generate project documentation using AI
router.post('/generate', validate(sowValidator.generateSchema), sowController.generate);

// Finalize project and generate files
router.post('/finalize/:id', sowController.finalize);

// List all projects
router.get('/projects', sowController.list);

// Get project by ID
router.get('/projects/:id', sowController.getById);

// Update project
router.put('/projects/:id', sowController.update);

// Delete project
router.delete('/projects/:id', sowController.remove);

export default router;
