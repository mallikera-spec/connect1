import { launchBrowser, closeBrowser } from '../../../utils/puppeteer.utils.js';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';

// Helper to convert number to words (Indian numbering system)
const numberToWords = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '';
    if (num === 0) return 'Zero';
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const format = (n) => {
        if (n < 20) return a[n];
        const digit = n % 10;
        if (digit === 0) return b[Math.floor(n / 10)];
        return b[Math.floor(n / 10)] + ' ' + a[digit];
    };

    const convert = (n) => {
        if (n === 0) return '';
        if (n < 100) return format(n);
        if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + convert(n % 100);
        if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand ' + convert(n % 1000);
        if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh ' + convert(n % 100000);
        return convert(Math.floor(n / 10000000)) + ' Crore ' + convert(n % 10000000);
    };

    const whole = Math.floor(num);
    const fraction = Math.round((num - whole) * 100);

    let res = convert(whole) + ' Rupees';
    if (fraction > 0) res += ' and ' + convert(fraction) + ' Paise';
    return res + ' Only';
};

/**
 * Generates a professional PDF for an Invoice.
 * @param {Object} invoice - The invoice data.
 * @returns {Promise<Buffer>} The PDF buffer.
 */
export const generateInvoicePDF = async (invoice) => {
    const browser = await launchBrowser();
    const page = await browser.newPage();

    const t = {
        primary: '#1E3A8A',     // Deep Blue
        secondary: '#334155',   // Slate Gray
        accent: '#06B6D4',      // Teal / Cyan
        bg: '#F8FAFC',          // Light gray sections background
        text: '#1E293B',        // Dark slate for text
        border: '#E2E8F0',
        white: '#FFFFFF'
    };

    const logoUrl = "https://res.cloudinary.com/dt4vwprm3/image/upload/v1764744525/WhatsApp_Image_2025-12-03_at_12.13.54_PM_rhgci7.jpg";

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

    const items = invoice.items || invoice.invoice_items || [];

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body { 
                font-family: 'Inter', sans-serif; 
                margin: 0; 
                padding: 0; 
                color: ${t.text};
                background-color: ${t.white};
                font-size: 11px;
            }
            .invoice-wrapper { width: 100%; position: relative; }
            .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 100px;
                color: rgba(0, 0, 0, 0.05); /* Increased opacity slightly for visibility */
                font-weight: 900;
                pointer-events: none;
                white-space: nowrap;
                z-index: 0;
                text-transform: uppercase;
            }
            .header {
                padding: 40px 40px 20px 40px;
                border-bottom: 2px solid ${t.primary};
                margin-bottom: 30px;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }
            .content { padding: 0 40px; position: relative; z-index: 1; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
            .section-title {
                color: ${t.primary};
                text-transform: uppercase;
                font-size: 10px;
                letter-spacing: 1px;
                margin-bottom: 8px;
                border-bottom: 1px solid ${t.border};
                padding-bottom: 3px;
                font-weight: 700;
            }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { 
                background-color: ${t.bg}; 
                padding: 10px; 
                border: 1px solid ${t.border}; 
                color: ${t.primary}; 
                text-align: center;
                font-weight: 700;
            }
            td { padding: 10px; border: 1px solid ${t.border}; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .summary-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 30px; margin-top: 10px; }
            .bank-details {
                background-color: ${t.bg};
                padding: 15px;
                border-radius: 4px;
                border: 1px solid ${t.border};
                font-size: 10px;
            }
            .totals-box { border: 1px solid ${t.border}; border-radius: 4px; overflow: hidden; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px dotted ${t.border}; }
            .net-amount { background-color: ${t.primary}; color: white; padding: 12px; display: flex; justify-content: space-between; font-weight: 800; font-size: 14px; }
            .footer {
                padding: 30px 40px;
                border-top: 1px solid ${t.border};
                text-align: center;
                font-size: 9px;
                color: ${t.secondary};
                margin-top: 40px;
            }
            @media print {
                .page-break { page-break-after: always; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-wrapper">
            <div class="watermark">ARGOSMOB TECH</div>
            
            <div class="header">
                <div>
                    <h1 style="margin: 0; fontSize: 28px; fontWeight: 800; color: ${t.primary}; textTransform: uppercase;">Tax Invoice</h1>
                    <div style="margin-top: 10px;">
                        <p style="margin: 2px 0;"><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
                        <p style="margin: 2px 0;"><strong>Date:</strong> ${formatDate(invoice.issue_date)}</p>
                        <p style="margin: 2px 0;"><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <img src="${logoUrl}" style="height: 45px; margin-bottom: 12px;" />
                    <div style="font-size: 10px; line-height: 1.4; color: ${t.secondary};">
                        <p style="margin: 0; font-weight: 800; color: ${t.primary}; font-size: 12px;">Argosmob Tech & AI Pvt. Ltd.</p>
                        <p style="margin: 2px 0;">618, Hope Tower, Galaxy Blue Sapphire,</p>
                        <p style="margin: 0;">Noida West, Uttar Pradesh - 201016</p>
                        <p style="margin: 5px 0 0 0;"><strong>PAN:</strong> ${invoice.company_pan || 'AAMCK0699L'}</p>
                        <p style="margin: 0;"><strong>CIN:</strong> U62011UP2025PTC229319</p>
                        <p style="margin: 0;"><strong>TAN:</strong> MRTK09086A</p>
                    </div>
                </div>
            </div>

            <div class="content">
                <div class="grid-2">
                    <div>
                        <div class="section-title">Bill To</div>
                        <div style="font-size: 11px;">
                            <p style="margin: 0 0 3px 0; font-size: 13px; font-weight: 700;">${clientDisplay.company}</p>
                            ${clientDisplay.contact ? `<p style="margin: 0 0 2px 0;">Attn: ${clientDisplay.contact}</p>` : ''}
                            <p style="margin: 0 0 2px 0;">${clientDisplay.address} ${clientDisplay.city}</p>
                            ${clientDisplay.email ? `<p style="margin: 2px 0 0 0; color: ${t.secondary};">${clientDisplay.email}</p>` : ''}
                            ${clientDisplay.gstin ? `<p style="margin: 4px 0 0 0;"><strong>GSTIN:</strong> ${clientDisplay.gstin}</p>` : ''}
                            ${clientDisplay.pan ? `<p style="margin: 0;"><strong>PAN:</strong> ${clientDisplay.pan}</p>` : ''}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div class="section-title">Project Information</div>
                        <p style="margin: 0; font-weight: 600;">${invoice.project?.name || 'N/A'}</p>
                        <p style="margin: 3px 0; color: ${t.secondary};"><strong>Currency:</strong> ${invoice.currency || 'INR'}</p>
                        <p style="margin: 0; color: ${t.secondary};"><strong>Place of Supply:</strong> ${invoice.client_state || (invoice.client && invoice.client.state) || 'Uttar Pradesh (09)'}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 30px;">S.N</th>
                            <th style="text-align: left;">Item Description</th>
                            <th style="width: 40px;">Qty</th>
                            <th style="width: 80px;" class="text-right">Unit Price</th>
                            <th style="width: 90px;" class="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((item, idx) => `
                            <tr>
                                <td class="text-center">${idx + 1}</td>
                                <td style="font-weight: 500;">${item.description || 'N/A'}</td>
                                <td class="text-center">${item.quantity}</td>
                                <td class="text-right">${formatCurrency(item.unit_price)}</td>
                                <td class="text-right" style="font-weight: 600;">${formatCurrency(item.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="summary-grid">
                    <div>
                        <div style="margin-bottom: 15px;">
                            <p style="margin: 0 0 5px 0; font-size: 10px; font-weight: 700; color: ${t.primary}; text-transform: uppercase;">Amount in Words</p>
                            <p style="margin: 0; font-weight: 600; font-style: italic; font-size: 11px; color: ${t.secondary};">${numberToWords(invoice.total_amount)}</p>
                        </div>
                        <div class="bank-details">
                            <h4 style="margin: 0 0 8px 0; font-size: 10px; color: ${t.primary}; text-transform: uppercase;">Bank Account Details</h4>
                            <div style="display: grid; grid-template-columns: 80px 1fr; gap: 4px;">
                                <span style="color: ${t.secondary};">Account:</span><strong>Argosmob Tech & AI Pvt. Ltd.</strong>
                                <span style="color: ${t.secondary};">Bank:</span><strong>Axis Bank</strong>
                                <span style="color: ${t.secondary};">A/C No:</span><strong>925020046080040</strong>
                                <span style="color: ${t.secondary};">IFSC Code:</span><strong>UTIB0003666</strong>
                                <span style="color: ${t.secondary};">Branch:</span><strong>Gr. Noida West (UP)</strong>
                            </div>
                        </div>
                        ${invoice.notes ? `
                        <div style="margin-top: 20px;">
                            <p style="margin: 0 0 5px 0; font-size: 10px; font-weight: 700; color: ${t.primary}; text-transform: uppercase;">Notes / Remarks</p>
                            <p style="margin: 0; font-size: 10px; line-height: 1.4; color: ${t.secondary}; white-space: pre-wrap;">${invoice.notes}</p>
                        </div>
                        ` : ''}
                    </div>
                    <div>
                        <div class="totals-box">
                            <div class="total-row">
                                <span>Sub Total</span>
                                <strong>${formatCurrency(invoice.subtotal)}</strong>
                            </div>
                            ${invoice.tax_amount > 0 ? `
                                <div class="total-row">
                                    <span>Tax (${invoice.tax_rate}%)</span>
                                    <strong>${formatCurrency(invoice.tax_amount)}</strong>
                                </div>
                            ` : ''}
                            ${invoice.discount_amount > 0 ? `
                                <div class="total-row" style="color: #ef4444;">
                                    <span>Discount</span>
                                    <strong>-${formatCurrency(invoice.discount_amount)}</strong>
                                </div>
                            ` : ''}
                            <div class="net-amount">
                                <span style="font-size: 12px;">Net Amount</span>
                                <span style="font-size: 15px;">${formatCurrency(invoice.total_amount)}</span>
                            </div>
                        </div>
                        <div style="margin-top: 30px; text-align: center;">
                            <div style="height: 40px;"></div>
                            <p style="margin: 0; font-weight: 700;">Authorized Signatory</p>
                            <p style="margin: 0; font-size: 9px; color: ${t.secondary};">Argosmob Tech & AI Pvt. Ltd.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p style="margin: 0 0 4px 0; font-weight: 700;">Note: Any discrepancy in this invoice should be notified within 7 days of receipt.</p>
                <p style="margin: 0;">Registered Office: 618, Hope Tower, Galaxy Blue Sapphire, Noida West, Uttar Pradesh, 201016</p>
                <p style="margin: 4px 0 0 0;">CIN: U72900UP2022PTC164525 | Email: hello@argosmob.onmicrosoft.com</p>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        });
        return pdfBuffer;
    } finally {
        await closeBrowser(browser);
    }
};
