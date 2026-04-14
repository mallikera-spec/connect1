import * as invoiceService from './invoices.service.js';
import { generateInvoicePDF } from './services/invoicePdfService.js';
import { generateInvoiceWord } from './services/invoiceWordService.js';

export const createInvoice = async (req, res) => {
    try {
        const { items, ...invoiceData } = req.body;
        const invoice = await invoiceService.createInvoice({
            ...invoiceData,
            created_by: req.user.id
        }, items);
        res.status(201).json({ success: true, data: invoice });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getAllInvoices = async (req, res) => {
    try {
        const invoices = await invoiceService.getAllInvoices(req.query);
        res.json({ success: true, data: invoices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getInvoiceById = async (req, res) => {
    try {
        const invoice = await invoiceService.getInvoiceById(req.params.id);
        res.json({ success: true, data: invoice });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const updateInvoice = async (req, res) => {
    try {
        const { items, ...updateData } = req.body;
        const invoice = await invoiceService.updateInvoice(req.params.id, updateData, items);
        res.json({ success: true, data: invoice });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteInvoice = async (req, res) => {
    try {
        await invoiceService.deleteInvoice(req.params.id);
        res.json({ success: true, message: 'Invoice deleted successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateStatus = async (req, res) => {
    try {
        const invoice = await invoiceService.updateInvoiceStatus(req.params.id, req.body.status);
        res.json({ success: true, data: invoice });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const exportInvoiceDocs = async (req, res) => {
    try {
        const invoice = await invoiceService.getInvoiceById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        const [pdfBuffer, docxBuffer] = await Promise.all([
            generateInvoicePDF(invoice),
            generateInvoiceWord(invoice),
        ]);

        res.json({
            success: true,
            data: {
                pdfBase64: Buffer.from(pdfBuffer).toString('base64'),
                docxBase64: Buffer.from(docxBuffer).toString('base64'),
                fileName: `Invoice_${invoice.invoice_number.replace(/\s+/g, '_')}`
            }
        });
    } catch (error) {
        console.error('Invoice Export Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const downloadInvoicePdf = async (req, res) => {
    try {
        const invoice = await invoiceService.getInvoiceById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        const pdfBuffer = await generateInvoicePDF(invoice);
        const fileName = `Invoice_${invoice.invoice_number.replace(/\s+/g, '_')}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);
    } catch (error) {
        console.error('Invoice PDF Download Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

