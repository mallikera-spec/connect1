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

// Specific Record Operations
router.get('/leads/:id', salesController.getLead);
router.get('/leads/:id/journey', salesController.getLeadJourney);
router.post('/leads/:id/onboard', salesController.onboardLead);
router.patch('/leads/:id', salesController.updateLead);
router.delete('/leads/:id', salesController.deleteLead);

/* ── Follow-Up Routes ── */
router.get('/follow-ups', salesController.getFollowUps);
router.post('/leads/:id/follow-ups', salesController.createFollowUp);
router.patch('/leads/:id/follow-ups/:fid', salesController.updateFollowUp);
router.delete('/leads/:id/follow-ups/:fid', salesController.deleteFollowUp);

/* ── Dashboard Metrics ── */
router.get('/metrics', salesController.getMetrics);

export default router;
