import express from 'express';
import * as clientsController from './clients.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get/Create clients (Managers, Admins, or any auth user can create/view their own)
router.get('/', clientsController.getAllClients);
router.post('/', clientsController.createClient);

// Specific client operations
router.get('/:id', clientsController.getClientById);
router.patch('/:id', clientsController.updateClient);
router.delete('/:id', requirePermission('admin'), clientsController.deleteClient);

export default router;
