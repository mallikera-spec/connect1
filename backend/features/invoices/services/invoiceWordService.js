import {
    Document, Packer, Paragraph, TextRun, AlignmentType, 
    BorderStyle, Table, TableRow, TableCell, WidthType, 
    ShadingType, Header, Footer, ImageRun
} from 'docx';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';

/**
 * Generates a professionally styled Word document (.docx) from invoice data.
 * @param {Object} invoice - The invoice data.
 * @returns {Promise<Buffer>} The Docx buffer.
 */
export const generateInvoiceWord = async (invoice) => {
    const t = {
        primary: '1E3A8A', 
        secondary: '334155',
        accent: 'F8FAFC',
        text: '1E293B',
        border: 'E2E8F0',
        white: 'FFFFFF'
    };

    const items = invoice.items || invoice.invoice_items || [];

    const clientDisplay = {
        company: invoice.client_company_name || (invoice.client && invoice.client.company_name) || 'Valued Client',
        address: invoice.client_address || '',
        city: invoice.client_city || '',
        contact: invoice.client_contact_name || (invoice.client && invoice.client.contact_name) || '',
        email: invoice.client_email || (invoice.client && invoice.client.email) || '',
        phone: invoice.client_phone || (invoice.client && invoice.client.phone) || '',
        gstin: invoice.client_gstin || '',
        pan: invoice.client_pan || ''
    };

    const hr = () => new Paragraph({
        border: { bottom: { color: t.primary, style: BorderStyle.SINGLE, size: 12 } },
        spacing: { before: 200, after: 200 },
        children: [],
    });

    const doc = new Document({
        creator: 'Argosmob Tech & AI',
        title: `Tax Invoice - ${invoice.invoice_number}`,
        sections: [
            {
                properties: {
                    page: {
                        margin: { top: 720, right: 720, bottom: 720, left: 720 },
                    },
                },
                headers: {
                    default: new Header({
                        children: [
                            new Table({
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                                    left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                                    insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
                                },
                                rows: [
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({
                                                                text: 'TAX INVOICE',
                                                                bold: true,
                                                                color: t.primary,
                                                                size: 48,
                                                            }),
                                                        ],
                                                    }),
                                                ],
                                            }),
                                            new TableCell({
                                                children: [
                                                    new Paragraph({
                                                        alignment: AlignmentType.RIGHT,
                                                        children: [
                                                            new TextRun({ text: 'Argosmob Tech & AI Pvt. Ltd.', bold: true, color: t.primary, size: 24 }),
                                                        ],
                                                    }),
                                                    new Paragraph({
                                                        alignment: AlignmentType.RIGHT,
                                                        children: [
                                                            new TextRun({ text: '618, Hope Tower, Galaxy Blue Sapphire, Noida West', size: 18 }),
                                                        ],
                                                    }),
                                                    new Paragraph({
                                                        alignment: AlignmentType.RIGHT,
                                                        children: [
                                                            new TextRun({ text: `PAN: ${invoice.company_pan || 'AAMCK0699L'} | CIN: U62011UP2025PTC229319`, size: 18 }),
                                                        ],
                                                    }),
                                                    new Paragraph({
                                                        alignment: AlignmentType.RIGHT,
                                                        children: [
                                                            new TextRun({ text: `TAN: MRTK09086A`, size: 18 }),
                                                        ],
                                                    }),
                                                ],
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                },
                children: [
                    new Paragraph({
                        spacing: { before: 200 },
                        children: [
                            new TextRun({ text: 'Invoice #: ', bold: true }),
                            new TextRun({ text: invoice.invoice_number }),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Date: ', bold: true }),
                            new TextRun({ text: formatDate(invoice.issue_date) }),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Due Date: ', bold: true }),
                            new TextRun({ text: formatDate(invoice.due_date) }),
                        ],
                    }),

                    new Paragraph({ spacing: { before: 400 }, children: [] }),

                    // --- BILLING GRID ---
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                            insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
                        },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 60, type: WidthType.PERCENTAGE },
                                        children: [
                                            new Paragraph({
                                                children: [new TextRun({ text: 'BILL TO', bold: true, color: t.primary, size: 20 })],
                                                border: { bottom: { color: t.border, style: BorderStyle.SINGLE, size: 6 } },
                                                spacing: { after: 100 }
                                            }),
                                            new Paragraph({ children: [new TextRun({ text: clientDisplay.company, bold: true, size: 26 })] }),
                                            new Paragraph({ children: [new TextRun({ text: `Attn: ${clientDisplay.contact}` })] }),
                                            new Paragraph({ children: [new TextRun({ text: `${clientDisplay.address} ${clientDisplay.city}` })] }),
                                            new Paragraph({ children: [new TextRun({ text: clientDisplay.email, color: t.secondary })] }),
                                            new Paragraph({ children: [new TextRun({ text: `GSTIN: ${clientDisplay.gstin}`, bold: true })] }),
                                        ],
                                    }),
                                    new TableCell({
                                        width: { size: 40, type: WidthType.PERCENTAGE },
                                        children: [
                                            new Paragraph({
                                                alignment: AlignmentType.RIGHT,
                                                children: [new TextRun({ text: 'PROJECT INFORMATION', bold: true, color: t.primary, size: 20 })],
                                                border: { bottom: { color: t.border, style: BorderStyle.SINGLE, size: 6 } },
                                                spacing: { after: 100 }
                                            }),
                                            new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: invoice.project?.name || 'N/A', bold: true })] }),
                                            new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Currency: ${invoice.currency || 'INR'}` })] }),
                                            new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Place of Supply: ${invoice.client_state || 'Uttar Pradesh (09)'}` })] }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),

                    new Paragraph({ spacing: { before: 400 }, children: [] }),

                    // --- ITEMS TABLE ---
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: 'S.N', bold: true, alignment: AlignmentType.CENTER })], shading: { fill: t.accent } }),
                                    new TableCell({ children: [new Paragraph({ text: 'Item Description', bold: true })], shading: { fill: t.accent } }),
                                    new TableCell({ children: [new Paragraph({ text: 'Qty', bold: true, alignment: AlignmentType.CENTER })], shading: { fill: t.accent } }),
                                    new TableCell({ children: [new Paragraph({ text: 'Unit Price', bold: true, alignment: AlignmentType.RIGHT })], shading: { fill: t.accent } }),
                                    new TableCell({ children: [new Paragraph({ text: 'Amount', bold: true, alignment: AlignmentType.RIGHT })], shading: { fill: t.accent } }),
                                ],
                            }),
                            ...items.map((item, i) => new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: (i + 1).toString(), alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [new Paragraph({ text: item.description || 'N/A' })] }),
                                    new TableCell({ children: [new Paragraph({ text: item.quantity.toString(), alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [new Paragraph({ text: formatCurrency(item.unit_price, invoice.currency), alignment: AlignmentType.RIGHT })] }),
                                    new TableCell({ children: [new Paragraph({ text: formatCurrency(item.total, invoice.currency), alignment: AlignmentType.RIGHT, bold: true })] }),
                                ],
                            })),
                        ],
                    }),

                    new Paragraph({ spacing: { before: 400 }, children: [] }),

                    // --- FOOTER SUMMARY ---
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                            insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
                        },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 60, type: WidthType.PERCENTAGE },
                                        children: [
                                            new Paragraph({ children: [new TextRun({ text: 'BANK ACCOUNT DETAILS', bold: true, color: t.primary, size: 18 })] }),
                                            new Paragraph({ children: [new TextRun({ text: 'Account: Argosmob Tech & AI Pvt. Ltd.' })] }),
                                            new Paragraph({ children: [new TextRun({ text: 'Bank: Axis Bank' })] }),
                                            new Paragraph({ children: [new TextRun({ text: 'Account No: 925020046080040' })] }),
                                            new Paragraph({ children: [new TextRun({ text: 'IFSC Code: UTIB0003666' })] }),
                                            new Paragraph({ children: [new TextRun({ text: 'Branch: Gr. Noida West (UP)' })] }),
                                            ...(invoice.notes ? [
                                                new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: 'NOTES / REMARKS', bold: true, color: t.primary, size: 18 })] }),
                                                new Paragraph({ children: [new TextRun({ text: invoice.notes, size: 18 })] }),
                                            ] : []),
                                        ],
                                    }),
                                    new TableCell({
                                        width: { size: 40, type: WidthType.PERCENTAGE },
                                        children: [
                                            new Table({
                                                width: { size: 100, type: WidthType.PERCENTAGE },
                                                rows: [
                                                    new TableRow({
                                                        children: [
                                                            new TableCell({ children: [new Paragraph({ text: 'Sub Total' })] }),
                                                            new TableCell({ children: [new Paragraph({ text: formatCurrency(invoice.subtotal, invoice.currency), alignment: AlignmentType.RIGHT })] }),
                                                        ]
                                                    }),
                                                    new TableRow({
                                                        children: [
                                                            new TableCell({ children: [new Paragraph({ text: 'Net Amount', bold: true, color: 'FFFFFF' })], shading: { fill: t.primary } }),
                                                            new TableCell({ children: [new Paragraph({ text: formatCurrency(invoice.total_amount, invoice.currency), alignment: AlignmentType.RIGHT, bold: true, color: 'FFFFFF' })], shading: { fill: t.primary } }),
                                                        ]
                                                    }),
                                                ]
                                            })
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),

                    new Paragraph({ spacing: { before: 600 }, children: [] }),
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                            new TextRun({ text: 'Authorized Signatory', bold: true }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                            new TextRun({ text: 'Argosmob Tech & AI Pvt. Ltd.', size: 18, color: t.secondary }),
                        ],
                    }),
                ],
            },
        ],
    });

    return await Packer.toBuffer(doc);
};
