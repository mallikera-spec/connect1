import React from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';

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

const InvoiceTemplate = ({ invoice }) => {
    if (!invoice) return null;

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
        company: invoice.client_company_name || invoice.client?.company_name || 'Valued Client',
        address: invoice.client_address || '',
        city: invoice.client_city || '',
        contact: invoice.client_contact_name || invoice.client?.contact_name || '',
        email: invoice.client_email || invoice.client?.email || '',
        phone: invoice.client_phone || invoice.client?.phone || '',
        gstin: invoice.client_gstin || '',
        pan: invoice.client_pan || ''
    };

    return (
        <div className="invoice-print-wrapper" style={{ 
            fontFamily: "'Inter', sans-serif",
            color: t.text,
            backgroundColor: t.white,
            position: 'relative',
            fontSize: '12px'
        }}>
            {/* Stable Page Layout Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
                <thead>
                    <tr>
                        <td>
                            {/* Header Fragment - Repeats on every page if needed, but usually once */}
                            <div style={{ padding: '30px 30px 10px 30px', borderBottom: `2px solid ${t.primary}`, marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: t.primary, textTransform: 'uppercase' }}>Tax Invoice</h1>
                                        <div style={{ marginTop: '10px' }}>
                                            <p style={{ margin: '2px 0' }}><strong>Invoice #:</strong> {invoice.invoice_number}</p>
                                            <p style={{ margin: '2px 0' }}><strong>Date:</strong> {formatDate(invoice.issue_date)}</p>
                                            <p style={{ margin: '2px 0' }}><strong>Due Date:</strong> {formatDate(invoice.due_date)}</p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <img src={logoUrl} alt="Logo" style={{ height: '40px', marginBottom: '10px' }} />
                                        <div style={{ fontSize: '10px', color: t.secondary }}>
                                            <p style={{ margin: 0, fontWeight: 700 }}>Argosmob Tech & AI Pvt. Ltd.</p>
                                            <p style={{ margin: 0 }}>618, Hope Tower, Galaxy Blue Sapphire, Noida West</p>
                                            <p style={{ margin: 0 }}><strong>GSTIN:</strong> {invoice.company_gstin || '09AAACA9183G1Z0'}</p>
                                            <p style={{ margin: 0 }}><strong>PAN:</strong> {invoice.company_pan || 'AAACA9183G'}</p>
                                            <p style={{ margin: 0 }}><strong>CIN:</strong> U72900UP2022PTC164525</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                </thead>

                <tbody>
                    <tr>
                        <td style={{ padding: '0 30px' }}>
                            {/* Watermark Overlay */}
                            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)', fontSize: '70px', color: 'rgba(30,58,138,0.03)', fontWeight: 900, pointerEvents: 'none', zIndex: 0, whiteSpace: 'nowrap' }}>
                                ARGOSMOB TECH
                            </div>

                            {/* Billing & Info Section */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', marginBottom: '30px', position: 'relative', zIndex: 1 }}>
                                <div>
                                    <h4 style={{ color: t.primary, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px', marginBottom: '8px', borderBottom: `1px solid ${t.border}`, paddingBottom: '3px' }}>Bill To</h4>
                                    <div style={{ fontSize: '12px' }}>
                                        <p style={{ margin: '0 0 3px 0', fontSize: '14px', fontWeight: 700 }}>{clientDisplay.company}</p>
                                        {clientDisplay.contact && <p style={{ margin: '0 0 2px 0' }}>Attn: {clientDisplay.contact}</p>}
                                        {(clientDisplay.address || clientDisplay.city) && (
                                            <p style={{ margin: '0 0 2px 0' }}>{clientDisplay.address} {clientDisplay.city}</p>
                                        )}
                                        {clientDisplay.email && <p style={{ margin: '2px 0 0 0', color: t.secondary }}>{clientDisplay.email}</p>}
                                        {clientDisplay.gstin && <p style={{ margin: '4px 0 0 0' }}><strong>GSTIN:</strong> {clientDisplay.gstin}</p>}
                                        {clientDisplay.pan && <p style={{ margin: '0' }}><strong>PAN:</strong> {clientDisplay.pan}</p>}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h4 style={{ color: t.primary, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px', marginBottom: '8px', borderBottom: `1px solid ${t.border}`, paddingBottom: '3px' }}>Project Information</h4>
                                    <p style={{ margin: '0', fontSize: '12px', fontWeight: 600 }}>{invoice.project?.name || 'N/A'}</p>
                                    <p style={{ margin: '3px 0', color: t.secondary }}><strong>Currency:</strong> {invoice.currency || 'INR'}</p>
                                    <p style={{ margin: 0, color: t.secondary }}><strong>Place of Supply:</strong> {invoice.client_state || invoice.client?.state || 'Uttar Pradesh (09)'}</p>
                                </div>
                            </div>

                            {/* Main Items Table */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                                <thead>
                                    <tr style={{ backgroundColor: t.bg }}>
                                        <th style={{ padding: '10px', border: `1px solid ${t.border}`, color: t.primary, width: '40px' }}>S.N</th>
                                        <th style={{ padding: '10px', border: `1px solid ${t.border}`, color: t.primary, textAlign: 'left' }}>Item Description</th>
                                        <th style={{ padding: '10px', border: `1px solid ${t.border}`, color: t.primary, width: '80px' }}>HSN/SAC</th>
                                        <th style={{ padding: '10px', border: `1px solid ${t.border}`, color: t.primary, width: '50px', textAlign: 'center' }}>Qty</th>
                                        <th style={{ padding: '10px', border: `1px solid ${t.border}`, color: t.primary, width: '100px', textAlign: 'right' }}>Unit Price</th>
                                        <th style={{ padding: '10px', border: `1px solid ${t.border}`, color: t.primary, width: '120px', textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(invoice.items || invoice.invoice_items || []).map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ padding: '10px', border: `1px solid ${t.border}`, textAlign: 'center' }}>{idx + 1}</td>
                                             <td style={{ padding: '10px', border: `1px solid ${t.border}`, fontWeight: 500, wordBreak: 'break-word', color: t.text }}>
                                                 {item.description || "N/A"}
                                             </td>
                                            <td style={{ padding: '10px', border: `1px solid ${t.border}`, textAlign: 'center', color: t.secondary }}>9983</td>
                                            <td style={{ padding: '10px', border: `1px solid ${t.border}`, textAlign: 'center' }}>{item.quantity}</td>
                                            <td style={{ padding: '10px', border: `1px solid ${t.border}`, textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                                            <td style={{ padding: '10px', border: `1px solid ${t.border}`, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Summary & Bank Section */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', marginTop: '10px', position: 'relative', zIndex: 1, pageBreakInside: 'avoid' }}>
                                <div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <p style={{ margin: '0 0 5px 0', fontSize: '11px', fontWeight: 700, color: t.primary, textTransform: 'uppercase' }}>Amount in Words</p>
                                        <p style={{ margin: 0, fontWeight: 600, fontStyle: 'italic', fontSize: '12px', color: t.secondary }}>{numberToWords(invoice.total_amount)}</p>
                                    </div>
                                    <div style={{ backgroundColor: t.bg, padding: '15px', borderRadius: '4px', border: `1px solid ${t.border}` }}>
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', color: t.primary, textTransform: 'uppercase' }}>Bank Account Details</h4>
                                        <div style={{ fontSize: '11px', display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px' }}>
                                            <span>Account:</span><strong>Argosmob Tech & AI Pvt. Ltd.</strong>
                                            <span>Bank:</span><strong>Axis Bank</strong>
                                            <span>Account No:</span><strong>925020046080040</strong>
                                            <span>IFSC Code:</span><strong>UTIB0003666</strong>
                                            <span>Branch:</span><strong>Gr. Noida West</strong>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ border: `1px solid ${t.border}`, borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px dotted ${t.border}` }}>
                                            <span>Sub Total</span>
                                            <strong>{formatCurrency(invoice.subtotal)}</strong>
                                        </div>
                                        {invoice.tax_amount > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px dotted ${t.border}` }}>
                                                <span>Tax ({invoice.tax_rate}%)</span>
                                                <strong>{formatCurrency(invoice.tax_amount)}</strong>
                                            </div>
                                        )}
                                        {invoice.discount_amount > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px dotted ${t.border}`, color: '#ef4444' }}>
                                                <span>Discount</span>
                                                <strong>-{formatCurrency(invoice.discount_amount)}</strong>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: t.primary, color: 'white' }}>
                                            <span style={{ fontWeight: 700, fontSize: '13px' }}>Net Amount</span>
                                            <span style={{ fontWeight: 800, fontSize: '16px' }}>{formatCurrency(invoice.total_amount)}</span>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '30px', textAlign: 'center' }}>
                                        <div style={{ height: '50px' }}></div>
                                        <p style={{ margin: 0, fontWeight: 700 }}>Authorized Signatory</p>
                                        <p style={{ margin: 0, fontSize: '10px', color: t.secondary }}>Argosmob Tech & AI Pvt. Ltd.</p>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>

                <tfoot>
                    <tr>
                        <td style={{ padding: '20px 30px' }}>
                            <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: '10px', textAlign: 'center', fontSize: '9px', color: t.secondary }}>
                                <p style={{ margin: '0 0 4px 0', fontWeight: 700 }}>Note: Any discrepancy in this invoice should be notified within 7 days of receipt.</p>
                                <p style={{ margin: 0 }}>Registered Office: 618, Hope Tower, Galaxy Blue Sapphire, Noida West, Uttar Pradesh, 201016</p>
                                <p style={{ margin: '4px 0 0 0' }}>CIN: U72900UP2022PTC164525 | Email: hello@argosmob.onmicrosoft.com</p>
                            </div>
                        </td>
                    </tr>
                </tfoot>
            </table>

            <style>{`
                @media print {
                    @page {
                        margin: 10mm;
                        size: A4;
                    }
                    
                    /* Hide EVERYTHING on the page by default */
                    body * {
                        visibility: hidden !important;
                    }

                    /* Specifically SHOW ONLY the invoice content and its hierarchy */
                    .invoice-print-wrapper, .invoice-print-wrapper * {
                        visibility: visible !important;
                        opacity: 1 !important;
                    }

                    /* Absolute positioning for printing to ignore the modal's current screen position */
                    .invoice-print-wrapper {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                        box-shadow: none !important;
                    }

                    /* Ensure any parent containers aren't cutting off the content */
                    html, body, #root, .modal-overlay, .modal, .modal-body {
                        height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                        position: static !important;
                        display: block !important;
                        background: transparent !important;
                    }

                    /* Force clear table structure for print engines */
                    .invoice-print-wrapper table { display: table !important; width: 100% !important; border-collapse: collapse !important; }
                    thead { display: table-header-group !important; }
                    tfoot { display: table-footer-group !important; }
                    tr { page-break-inside: avoid !important; }
                    
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
                
                .invoice-print-wrapper table { border-collapse: collapse; width: 100%; }
                .invoice-print-wrapper tr { page-break-inside: avoid; }
            `}</style>
        </div>
    );
};

export default InvoiceTemplate;
