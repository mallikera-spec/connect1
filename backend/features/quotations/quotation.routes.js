import { Router } from 'express';
import { previewQuotation, finalizeQuotation } from './quotation.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use(authMiddleware);
router.use(requirePermission('generate_quotations'));

// Generate AI quotation JSON only (no PDF/Word) — for preview & editing
router.post('/preview', previewQuotation);

// Accept edited quotation JSON and return PDF + Word documents
router.post('/finalize', finalizeQuotation);

export default router;
