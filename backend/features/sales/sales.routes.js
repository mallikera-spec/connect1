import { Router } from 'express';
import * as salesController from './sales.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

// Secure all sales routes
router.use(authMiddleware);

/* ── Lead Routes ── */
router.post('/leads', salesController.createLead);
router.get('/leads', salesController.getLeads);

// Bulk Operations (Priortized and prefixed to avoid UUID collision)
router.post('/leads/bulk/upload', salesController.bulkUploadLeads);
router.patch('/leads/bulk/assign', salesController.bulkAssignLeads);
router.patch('/leads/bulk/status', salesController.bulkUpdateStatus);
router.delete('/leads/bulk/delete', salesController.bulkDeleteLeads);

// Single Record Operations
router.get('/leads/:id', salesController.getLead);
router.get('/leads/:id/journey', salesController.getLeadJourney);
router.patch('/leads/:id', salesController.updateLead);
router.delete('/leads/:id', salesController.deleteLead);

/* ── Follow-Up Routes ── */
router.post('/leads/:id/follow-ups', salesController.createFollowUp);
router.patch('/leads/:id/follow-ups/:fid', salesController.updateFollowUp);

/* ── Dashboard Metrics ── */
router.get('/metrics', salesController.getMetrics);

export default router;
