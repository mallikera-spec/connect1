import React, { useState, useEffect, useMemo } from 'react';
import { 
    Plus, FileText, Download, Eye, Edit2, Trash2, 
    Search, Filter, Calendar, Users, Briefcase, 
    MoreVertical, CheckCircle, XCircle, Send,
    PlusCircle, Trash, FileDown, Loader2
} from 'lucide-react';
import { financeService } from './financeService';
import { ClientsService } from '../projects/ClientsService';
import DataTable from '../../components/common/DataTable';
import { formatDate, formatCurrency, toLocalISOString } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import InvoiceTemplate from './InvoiceTemplate';

export default function InvoiceManager() {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {
        fetchInvoices();
        fetchClients();
        fetchProjects();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const data = await financeService.getInvoices();
            if (data.success) setInvoices(data.data);
        } catch (err) {
            toast.error('Failed to load invoices');
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const res = await ClientsService.getClients();
            // Assuming res.data.data or res.data
            const clientList = res.data?.data || res.data || [];
            setClients(clientList);
        } catch (err) {
            console.error('Failed to load clients', err);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            const projectList = res.data?.data || res.data || [];
            setProjects(projectList);
        } catch (err) {
            console.error('Failed to load projects', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this invoice?')) return;
        try {
            await financeService.deleteInvoice(id);
            toast.success('Invoice deleted');
            fetchInvoices();
        } catch (err) {
            toast.error('Failed to delete invoice');
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await financeService.updateInvoiceStatus(id, status);
            toast.success(`Invoice marked as ${status}`);
            fetchInvoices();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const handleDownloadPdf = async (row) => {
        setDownloadingId(row.id);
        try {
            await financeService.downloadInvoicePdf(row.id, row.invoice_number);
            toast.success(`PDF downloaded: ${row.invoice_number}`);
        } catch (err) {
            toast.error('Failed to generate PDF. Please try again.');
            console.error(err);
        } finally {
            setDownloadingId(null);
        }
    };

    const columns = useMemo(() => [
        { 
            key: 'invoice_number', 
            label: 'Invoice #', 
            width: '130px',
            render: (val) => (
                <span style={{ fontWeight: 700, color: 'var(--accent-light)', whiteSpace: 'nowrap', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                    {val || '--'}
                </span>
            )
        },
        { 
            key: 'client.company_name', 
            label: 'Client',
            width: '150px',
            render: (val) => (
                <span style={{ fontWeight: 600, whiteSpace: 'nowrap', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                    {val || '--'}
                </span>
            )
        },
        { 
            key: 'issue_date', 
            label: 'Issue Date', 
            type: 'date',
            width: '110px',
            render: (val) => formatDate(val)
        },
        { 
            key: 'due_date', 
            label: 'Due Date', 
            type: 'date',
            width: '110px',
            render: (val) => formatDate(val)
        },
        { 
            key: 'total_amount', 
            label: 'Amount', 
            type: 'currency',
            align: 'right',
            width: '130px',
            render: (val) => <span style={{ fontWeight: 700 }}>{formatCurrency(val)}</span>
        },
        { 
            key: 'status', 
            label: 'Status', 
            type: 'status',
            width: '110px',
            render: (val) => {
                const safe = (val || 'draft').toLowerCase();
                return <span className={`status-badge ${safe}`}>{safe}</span>;
            }
        },
        { 
            key: 'project.name', 
            label: 'Project',
            width: '160px',
            render: (val) => (
                <span style={{ fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                    {val || '--'}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            width: '148px',
            sortable: false,
            align: 'center',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                    <button
                        className="inv-action-btn"
                        title="View Invoice"
                        onClick={(e) => { e.stopPropagation(); setSelectedInvoice(row); setShowViewModal(true); }}
                    >
                        <Eye size={14} />
                    </button>
                    <button
                        className="inv-action-btn"
                        title="Edit Invoice"
                        onClick={(e) => { e.stopPropagation(); setSelectedInvoice(row); setShowCreateModal(true); }}
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        className="inv-action-btn"
                        title="Download PDF"
                        onClick={(e) => { e.stopPropagation(); handleDownloadPdf(row); }}
                        disabled={downloadingId === row.id}
                        style={{ color: downloadingId === row.id ? 'var(--text-dim)' : 'var(--accent-light)' }}
                    >
                        {downloadingId === row.id
                            ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            : <FileDown size={14} />}
                    </button>
                    <button
                        className="inv-action-btn"
                        title="Delete Invoice"
                        onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                        style={{ color: 'var(--danger)' }}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        }
    ], [invoices, downloadingId]);



    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const matchesSearch = searchTerm === '' || 
                inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === '' || inv.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [invoices, searchTerm, statusFilter]);

    return (
        <div className="invoice-manager-container page-container" style={{ padding: '24px 40px' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Invoices</h1>
                    <p style={{ color: 'var(--text-dim)' }}>Manage client billing and payment status</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setSelectedInvoice(null); setShowCreateModal(true); }}>
                    <Plus size={18} /> Create Invoice
                </button>
            </div>

            <div className="card polished-card" style={{ marginBottom: '24px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Search by invoice number or client..." 
                            style={{ paddingLeft: '36px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ width: '200px' }}>
                        <select 
                            className="form-control"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="void">Void</option>
                        </select>
                    </div>
                </div>
            </div>

            <DataTable 
                data={filteredInvoices}
                columns={columns}
                loading={loading}
                fileName="invoices-export"
                selectable={false}
            />

            {(showCreateModal || showViewModal) && (
                <InvoiceModal 
                    isOpen={showCreateModal || showViewModal}
                    onClose={() => { setShowCreateModal(false); setShowViewModal(false); setSelectedInvoice(null); }}
                    onSave={fetchInvoices}
                    invoice={selectedInvoice}
                    clients={clients}
                    projects={projects}
                    readOnly={showViewModal}
                />
            )}

            <style>{`
                .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid transparent; }
                .status-badge.draft { background: rgba(156, 163, 175, 0.1); color: #9ca3af; border-color: rgba(156, 163, 175, 0.2); }
                .status-badge.sent { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border-color: rgba(59, 130, 246, 0.2); }
                .status-badge.paid { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.2); }
                .status-badge.void { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.2); }
                .status-badge.partially_paid { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-color: rgba(245, 158, 11, 0.2); }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .inv-action-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    min-width: 28px;
                    border-radius: 6px;
                    border: 1px solid var(--border);
                    background: transparent;
                    color: var(--text-dim);
                    cursor: pointer;
                    transition: background 0.15s, color 0.15s, border-color 0.15s;
                    padding: 0;
                    overflow: hidden;
                    flex-shrink: 0;
                }
                .inv-action-btn:hover { background: rgba(255,255,255,0.06); color: var(--text); border-color: var(--text-dim); }
                .inv-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
            `}</style>
        </div>
    );
}

function InvoiceModal({ isOpen, onClose, onSave, invoice, clients, projects, readOnly }) {
    const [formData, setFormData] = useState({
        client_id: '',
        project_id: '',
        client_company_name: '',
        client_address: '',
        client_city: '',
        client_contact_name: '',
        client_email: '',
        client_phone: '',
        client_gstin: '',
        client_pan: '',
        company_gstin: '09AAACA9183G1Z0',
        company_pan: 'AAACA9183G',
        issue_date: toLocalISOString(new Date()).split('T')[0],
        due_date: toLocalISOString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).split('T')[0],
        status: 'draft',
        currency: 'INR',
        tax_rate: 0,
        discount_amount: 0,
        notes: '',
        items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
    });

    const [showCustomDetails, setShowCustomDetails] = useState(false);
    const [fullLoading, setFullLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (type) => {
        setIsExporting(true);
        try {
            const res = await financeService.exportInvoice(invoice.id);
            if (res.success) {
                const { pdfBase64, docxBase64, fileName } = res.data;
                const base64 = type === 'pdf' ? pdfBase64 : docxBase64;
                const mimeType = type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                const extension = type === 'pdf' ? 'pdf' : 'docx';
                
                triggerDownload(base64, mimeType, `${fileName}.${extension}`);
                toast.success(`${type.toUpperCase()} downloaded`);
            }
        } catch (err) {
            toast.error(`Export to ${type.toUpperCase()} failed`);
            console.error(err);
        } finally {
            setIsExporting(false);
        }
    };

    const triggerDownload = (base64, type, fileName) => {
        const linkSource = `data:${type};base64,${base64}`;
        const downloadLink = document.createElement("a");
        downloadLink.href = linkSource;
        downloadLink.download = fileName;
        downloadLink.click();
    };

    useEffect(() => {
        const loadFullInvoice = async () => {
            if (invoice && invoice.id) {
                // If items are missing (common when opening from list), fetch full details
                if (!invoice.items || invoice.items.length === 0) {
                    try {
                        setFullLoading(true);
                        const res = await financeService.getInvoiceById(invoice.id);
                        if (res.success) {
                            const fullInvoice = res.data;
                            setFormData({
                                ...fullInvoice,
                                issue_date: (fullInvoice.issue_date || '').split('T')[0],
                                due_date: (fullInvoice.due_date || '').split('T')[0],
                                items: fullInvoice.items || fullInvoice.invoice_items || [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
                            });
                            if (fullInvoice.client_company_name || fullInvoice.client_address || fullInvoice.client_phone) {
                                setShowCustomDetails(true);
                            }
                            setFullLoading(false);
                            return;
                        }
                    } catch (err) {
                        console.error('Failed to fetch full invoice details', err);
                    } finally {
                        setFullLoading(false);
                    }
                } else {
                    // Default behavior if items exist
                    setFormData({
                        ...invoice,
                        issue_date: (invoice.issue_date || '').split('T')[0],
                        due_date: (invoice.due_date || '').split('T')[0],
                        items: invoice.items || invoice.invoice_items || [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
                    });
                    if (invoice.client_company_name || invoice.client_address || invoice.client_phone) {
                        setShowCustomDetails(true);
                    }
                }
            } else {
                // Reset form for create
                setFormData({
                    client_id: '',
                    project_id: '',
                    client_company_name: '',
                    client_address: '',
                    client_city: '',
                    client_contact_name: '',
                    client_email: '',
                    client_phone: '',
                    client_gstin: '',
                    client_pan: '',
                    company_gstin: '09AAACA9183G1Z0',
                    company_pan: 'AAACA9183G',
                    issue_date: toLocalISOString(new Date()).split('T')[0],
                    due_date: toLocalISOString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).split('T')[0],
                    status: 'draft',
                    currency: 'INR',
                    subtotal: 0,
                    tax_amount: 0,
                    total_amount: 0,
                    items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
                });
                setShowCustomDetails(false);
            }
        };
        loadFullInvoice();
    }, [invoice, isOpen]);

    const handleFillFromClient = () => {
        const selectedClient = clients.find(c => c.id === formData.client_id);
        if (selectedClient) {
            setFormData({
                ...formData,
                client_company_name: selectedClient.company_name || '',
                client_contact_name: selectedClient.contact_name || '',
                client_email: selectedClient.email || '',
                client_phone: selectedClient.phone || '',
                client_address: selectedClient.address || '',
                client_city: selectedClient.city || ''
            });
            setShowCustomDetails(true);
            toast.success('Fields filled from client record');
        } else {
            toast.error('Please select a client first');
        }
    };

    const calculateTotals = (items, taxRate, discount) => {
        const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
        const tax_amount = (subtotal * (Number(taxRate) || 0)) / 100;
        const total_amount = subtotal + tax_amount - (Number(discount) || 0);
        return { subtotal, tax_amount, total_amount };
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        if (field === 'quantity' || field === 'unit_price') {
            newItems[index].total = Number(newItems[index].quantity) * Number(newItems[index].unit_price);
        }
        
        const totals = calculateTotals(newItems, formData.tax_rate, formData.discount_amount);
        setFormData({ ...formData, items: newItems, ...totals });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: '', quantity: 1, unit_price: 0, total: 0 }]
        });
    };

    const removeItem = (index) => {
        if (formData.items.length === 1) return;
        const newItems = formData.items.filter((_, i) => i !== index);
        const totals = calculateTotals(newItems, formData.tax_rate, formData.discount_amount);
        setFormData({ ...formData, items: newItems, ...totals });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Clean up empty strings for UUID fields and custom details
            const submissionData = {
                ...formData,
                project_id: formData.project_id === '' ? null : formData.project_id,
                client_id: formData.client_id === '' ? null : formData.client_id,
                client_company_name: formData.client_company_name || null,
                client_address: formData.client_address || null,
                client_city: formData.client_city || null,
                client_state: formData.client_state || null,
                client_zip: formData.client_zip || null,
                client_contact_name: formData.client_contact_name || null,
                client_email: formData.client_email === '' ? null : formData.client_email,
                client_phone: formData.client_phone || null,
                client_gstin: formData.client_gstin || null,
                client_pan: formData.client_pan || null
            };

            if (invoice) {
                await financeService.updateInvoice(invoice.id, submissionData);
                toast.success('Invoice updated');
            } else {
                await financeService.createInvoice(submissionData);
                toast.success('Invoice created');
            }
            onSave();
            onClose();
        } catch (err) {
            toast.error(err.message || 'Failed to save invoice');
        }
    };

    return (
        <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg slideUpSheet" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">{readOnly ? 'View Invoice' : (invoice ? 'Edit Invoice' : 'Create Invoice')}</h2>
                        {invoice && <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{invoice.invoice_number}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {readOnly && (
                            <>
                                <button 
                                    type="button" 
                                    className="btn btn-primary btn-sm" 
                                    onClick={() => handleExport('pdf')}
                                    disabled={fullLoading || isExporting}
                                >
                                    <Download size={16} /> {isExporting ? 'Generating...' : 'Download PDF'}
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-outline btn-sm" 
                                    onClick={() => handleExport('word')}
                                    disabled={fullLoading || isExporting}
                                >
                                    <FileText size={16} /> {isExporting ? 'Generating...' : 'Download Word'}
                                </button>
                            </>
                        )}
                        <button className="btn-icon" onClick={onClose}><XCircle size={20} /></button>
                    </div>
                </div>

                {readOnly ? (
                    <div className="modal-body" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-app)', padding: '40px', position: 'relative' }}>
                    {fullLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-dim)', gap: '15px' }}>
                            <div className="spinner-border text-primary" role="status"></div>
                            <p>Loading full invoice details...</p>
                        </div>
                    ) : (
                        <InvoiceTemplate invoice={formData} />
                    )}
                </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-body">
                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        Client 
                                        {formData.client_id && (
                                            <button type="button" onClick={handleFillFromClient} style={{ fontSize: '10px', color: 'var(--accent-light)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                                Fill Details Below
                                            </button>
                                        )}
                                    </label>
                                    <select 
                                        className="form-control" 
                                        required={!showCustomDetails}
                                        value={formData.client_id}
                                        onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                                    >
                                        <option value="">Select Master Client</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.company_name} {c.contact_name ? `(${c.contact_name})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Project (Optional)</label>
                                    <select 
                                        className="form-control" 
                                        value={formData.project_id}
                                        onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                                    >
                                        <option value="">Select Project</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Issue Date</label>
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        required 
                                        value={formData.issue_date}
                                        onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Due Date</label>
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        required 
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                                        <input 
                                            type="checkbox" 
                                            checked={showCustomDetails} 
                                            onChange={(e) => setShowCustomDetails(e.target.checked)}
                                        />
                                        Custom Client Details (Overwrites on Invoice)
                                    </label>
                                </div>

                                {showCustomDetails && (
                                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Company Name</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                value={formData.client_company_name}
                                                onChange={(e) => setFormData({ ...formData, client_company_name: e.target.value })}
                                                placeholder="Enter Company Name"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Contact Name</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                value={formData.client_contact_name}
                                                onChange={(e) => setFormData({ ...formData, client_contact_name: e.target.value })}
                                                placeholder="Enter Contact Name"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Address</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                value={formData.client_address}
                                                onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                                                placeholder="Street Address"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">City/State</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                value={formData.client_city}
                                                onChange={(e) => setFormData({ ...formData, client_city: e.target.value })}
                                                placeholder="City, State, Zip"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email</label>
                                            <input 
                                                type="email" 
                                                className="form-control" 
                                                value={formData.client_email}
                                                onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                                                placeholder="client@email.com"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Phone</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                value={formData.client_phone}
                                                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                                                placeholder="+91 XXXXX XXXXX"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Client GSTIN</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                value={formData.client_gstin}
                                                onChange={(e) => setFormData({ ...formData, client_gstin: e.target.value })}
                                                placeholder="GSTIN Number"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Client PAN</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                value={formData.client_pan}
                                                onChange={(e) => setFormData({ ...formData, client_pan: e.target.value })}
                                                placeholder="PAN Number"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="invoice-items-section" style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Line Items</h3>
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>
                                        <PlusCircle size={16} /> Add Item
                                    </button>
                                </div>
                                <div className="items-table-header" style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 120px 40px', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                                    <div>Description</div>
                                    <div style={{ textAlign: 'center' }}>Qty</div>
                                    <div style={{ textAlign: 'right' }}>Unit Price</div>
                                    <div style={{ textAlign: 'right' }}>Total</div>
                                    <div></div>
                                </div>
                                <div className="items-list" style={{ marginTop: '8px' }}>
                                    {formData.items.map((item, idx) => (
                                        <div key={idx} className="item-row" style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 120px 40px', gap: '12px', padding: '12px 10px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                placeholder="Description" 
                                                value={item.description}
                                                onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                                required
                                            />
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                style={{ textAlign: 'center' }} 
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                                required
                                            />
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                style={{ textAlign: 'right' }} 
                                                value={item.unit_price}
                                                onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                                                required
                                            />
                                            <div style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total)}</div>
                                            <button type="button" className="btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeItem(idx)}>
                                                <Trash size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="invoice-summary-section" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <div style={{ width: '300px' }}>
                                    <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' }}>
                                        <span style={{ color: 'var(--text-dim)' }}>Subtotal</span>
                                        <span style={{ fontWeight: 600 }}>{formatCurrency(formData.subtotal)}</span>
                                    </div>
                                    <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', gap: '12px', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Tax (%)</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                style={{ width: '80px', textAlign: 'right', height: '32px' }} 
                                                value={formData.tax_rate}
                                                onChange={(e) => {
                                                    const rate = e.target.value;
                                                    const totals = calculateTotals(formData.items, rate, formData.discount_amount);
                                                    setFormData({ ...formData, tax_rate: rate, ...totals });
                                                }}
                                            />
                                            <span style={{ fontWeight: 600, minWidth: '80px', textAlign: 'right' }}>{formatCurrency(formData.tax_amount)}</span>
                                        </div>
                                    </div>
                                    <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', gap: '12px', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Discount</span>
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            style={{ width: '120px', textAlign: 'right', height: '32px' }} 
                                            value={formData.discount_amount}
                                            onChange={(e) => {
                                                const disc = e.target.value;
                                                const totals = calculateTotals(formData.items, formData.tax_rate, disc);
                                                setFormData({ ...formData, discount_amount: disc, ...totals });
                                            }}
                                        />
                                    </div>
                                    <div className="summary-row total-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '2px solid var(--border)', marginTop: '8px' }}>
                                        <span style={{ fontWeight: 800, fontSize: '16px' }}>Total Amount</span>
                                        <span style={{ fontWeight: 800, fontSize: '20px', color: 'var(--accent-light)' }}>{formatCurrency(formData.total_amount)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '24px' }}>
                                <label className="form-label">Notes / Terms</label>
                                <textarea 
                                    className="form-control" 
                                    rows="3" 
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Additional notes or payment terms..."
                                />
                            </div>
                        </div>

                        <div className="modal-footer" style={{ marginTop: 'auto' }}>
                            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary">
                                <FileText size={18} /> {invoice ? 'Update Invoice' : 'Create Invoice'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
