import express from 'express';
import * as invoiceController from './invoices.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { invoiceSchema, updateStatusSchema } from './invoices.validation.js';

const router = express.Router();

router.get('/', invoiceController.getAllInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.post('/', validateRequest(invoiceSchema), invoiceController.createInvoice);
router.patch('/:id', validateRequest(invoiceSchema), invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);
router.patch('/:id/status', validateRequest(updateStatusSchema), invoiceController.updateStatus);

export default router;
