import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileType, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import Papa from 'papaparse';
import { SalesService } from './SalesService';
import toast from 'react-hot-toast';

export default function BulkUploadModal({ isOpen, onClose, onSuccess, agents, currentUser }) {
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [mapping, setMapping] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        source: '',
        status: '',
        deal_value: '',
        score: '',
        notes: '',
        notes_date: '',
        assigned_bdm: ''
    });
    const [assignedAgentId, setAssignedAgentId] = useState('');
    const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef(null);

    const isBDM = currentUser?.roles?.includes('BDM') && !currentUser?.roles?.includes('Super Admin') && !currentUser?.roles?.includes('Sales Manager');

    if (!isOpen) return null;

    const handleFileUpload = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
            toast.error('Please upload a valid CSV file.');
            return;
        }

        setFile(selectedFile);

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    setParsedData(results.data);
                    const fileHeaders = Object.keys(results.data[0]);
                    setHeaders(fileHeaders);

                    // Auto-map logic based on common naming conventions
                    const initialMapping = { ...mapping };
                    fileHeaders.forEach(header => {
                        const lowerHeader = header.toLowerCase().trim();
                        if (['name', 'full name', 'client name'].includes(lowerHeader)) initialMapping.name = header;
                        if (['company', 'company name'].includes(lowerHeader)) initialMapping.company = header;
                        if (['email', 'email address'].includes(lowerHeader)) initialMapping.email = header;
                        if (['phone', 'phone number', 'contact'].includes(lowerHeader)) initialMapping.phone = header;
                        if (['source', 'lead source'].includes(lowerHeader)) initialMapping.source = header;
                        if (['status', 'stage'].includes(lowerHeader)) initialMapping.status = header;
                    });
                    setMapping(initialMapping);
                    setStep(2);
                } else {
                    toast.error('The uploaded CSV file is empty.');
                }
            },
            error: (err) => {
                toast.error(`Error parsing CSV: ${err.message}`);
            }
        });
    };

    const handleMapChange = (dbField, csvHeader) => {
        setMapping(prev => ({ ...prev, [dbField]: csvHeader }));
    };

    const proceedToPreview = () => {
        if (!mapping.phone) {
            toast.error('Please map a CSV column to the "Phone Number" field as it is required.');
            return;
        }
        setStep(3);
    };

    const handleFinalUpload = async () => {
        setIsUploading(true);
        try {
            // Transform data based on mapping
            const mappedLeads = parsedData.map(row => {
                return {
                    name: row[mapping.name],
                    company: mapping.company ? row[mapping.company] : null,
                    email: mapping.email ? row[mapping.email] : null,
                    phone: mapping.phone ? row[mapping.phone] : null,
                    source: mapping.source ? row[mapping.source] : null,
                    status: mapping.status ? row[mapping.status] : null,
                    deal_value: mapping.deal_value ? row[mapping.deal_value] : null,
                    score: mapping.score ? row[mapping.score] : null,
                    notes: mapping.notes ? row[mapping.notes] : null,
                    notes_date: mapping.notes_date ? row[mapping.notes_date] : null,
                    assigned_bdm: mapping.assigned_bdm ? row[mapping.assigned_bdm] : null,
                };
            }).filter(lead => lead.phone && lead.phone.trim() !== ''); // Ensure phone exists

            if (mappedLeads.length === 0) {
                toast.error('No valid leads found to upload. Phone is required.');
                setIsUploading(false);
                return;
            }

            const agentToAssign = isBDM ? currentUser.id : assignedAgentId;

            await SalesService.bulkUploadLeads(mappedLeads, agentToAssign);

            toast.success(`Successfully queued ${mappedLeads.length} leads for creation.`);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Failed to upload leads');
        } finally {
            setIsUploading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setParsedData([]);
        setStep(1);
    };

    // Helper options array for db fields
    const dbFields = [
        { key: 'phone', label: 'Phone Number', required: true },
        { key: 'name', label: 'Full Name', required: false },
        { key: 'company', label: 'Company', required: false },
        { key: 'email', label: 'Email Address', required: false },
        { key: 'source', label: 'Lead Source', required: false },
        { key: 'status', label: 'Status/Stage', required: false },
        { key: 'deal_value', label: 'Deal Value', required: false },
        { key: 'score', label: 'Score (1-10)', required: false },
        { key: 'assigned_bdm', label: 'Assigned BDM (Name/Email)', required: false },
        { key: 'notes', label: 'Previous Agent Comments', required: false },
        { key: 'notes_date', label: 'Comment Date (YYYY-MM-DD)', required: false }
    ];

    const downloadSampleCSV = () => {
        const headers = ['Full Name', 'Phone', 'Company', 'Email', 'Source', 'Status', 'Deal Value', 'Score', 'Assigned BDM', 'Comments', 'Comment Date'];
        const sampleRow = ['John Doe', '+1234567890', 'Acme Corp', 'john@acme.com', 'Website', 'New', '5000', '8', 'Alice Smith', 'Spoke to them last week, very interested.', new Date().toISOString().split('T')[0]];
        
        const csvContent = [
            headers.join(','),
            sampleRow.join(',')
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'leads_sample_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">Bulk Upload Leads</h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                            {step === 1 && 'Upload a CSV file containing your leads.'}
                            {step === 2 && 'Map your CSV columns to the database fields.'}
                            {step === 3 && 'Preview your import before finalizing.'}
                        </p>
                    </div>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="modal-body" style={{ minHeight: '300px' }}>

                    {/* STEP 1: UPLOAD */}
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', py: 40 }}>
                            <div
                                style={{
                                    border: '2px dashed var(--border)',
                                    borderRadius: '12px',
                                    padding: '40px',
                                    textAlign: 'center',
                                    width: '100%',
                                    cursor: 'pointer',
                                    background: 'var(--bg-card)',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                        handleFileUpload({ target: { files: e.dataTransfer.files } });
                                    }
                                }}
                            >
                                <UploadCloud size={48} color="var(--accent)" style={{ margin: '0 auto 16px' }} />
                                <h3>Click or Drag & Drop CSV</h3>
                                <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginTop: '8px' }}>
                                    Standard CSV format with headers required.
                                </p>
                                <input
                                    type="file"
                                    accept=".csv"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileUpload}
                                />
                            </div>

                            <button 
                                type="button" 
                                className="btn btn-ghost btn-sm"
                                onClick={downloadSampleCSV}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}
                            >
                                <Download size={14} /> Download Sample CSV Template
                            </button>
                        </div>
                    )}

                    {/* STEP 2: MAPPING */}
                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
                                <FileType size={20} color="var(--accent)" />
                                <div>
                                    <h4 style={{ fontSize: '14px', margin: 0 }}>{file?.name}</h4>
                                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{parsedData.length} records found</span>
                                </div>
                                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={reset}>Change File</button>
                            </div>

                            {!isBDM && (
                                <div className="form-group" style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        Assign All Leads To
                                        <span style={{ fontWeight: 'normal', color: 'var(--text-dim)', textTransform: 'none' }}>(Optional)</span>
                                    </label>
                                    <select
                                        className="form-control"
                                        value={assignedAgentId}
                                        onChange={e => setAssignedAgentId(e.target.value)}
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {agents.map(agent => (
                                            <option key={agent.id} value={agent.id}>{agent.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40%' }}>Database Field</th>
                                            <th>CSV Column</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dbFields.map(field => (
                                            <tr key={field.key}>
                                                <td style={{ fontWeight: 600 }}>
                                                    {field.label}
                                                    {field.required && <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>}
                                                </td>
                                                <td>
                                                    <select
                                                        className="form-control"
                                                        value={mapping[field.key] || ''}
                                                        onChange={(e) => handleMapChange(field.key, e.target.value)}
                                                    >
                                                        <option value="">-- Ignore --</option>
                                                        {headers.map(h => (
                                                            <option key={h} value={h}>{h}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PREVIEW */}
                    {step === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1, padding: '16px', background: 'var(--success-bg)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <CheckCircle2 color="var(--success)" size={24} />
                                    <div>
                                        <h4 style={{ color: 'var(--success)', margin: 0, fontSize: '15px' }}>Ready to Import</h4>
                                        <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '13px' }}>{parsedData.length} records will be added to the system.</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Previewing first 5 records:</h4>
                                <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                                    <table style={{ whiteSpace: 'nowrap' }}>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Company</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedData.slice(0, 5).map((row, idx) => (
                                                <tr key={idx}>
                                                    <td>{row[mapping.name] || <span style={{ color: 'var(--danger)' }}>Missing</span>}</td>
                                                    <td>{mapping.company ? row[mapping.company] : '-'}</td>
                                                    <td>{mapping.email ? row[mapping.email] : '-'}</td>
                                                    <td>{mapping.phone ? row[mapping.phone] : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <div className="modal-footer" style={{ background: 'var(--bg-card)' }}>
                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isUploading}>
                        Cancel
                    </button>

                    {step === 2 && (
                        <button type="button" className="btn btn-primary" onClick={proceedToPreview}>
                            Continue to Preview
                        </button>
                    )}

                    {step === 3 && (
                        <>
                            <button type="button" className="btn btn-ghost" onClick={() => setStep(2)} disabled={isUploading}>
                                Back
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleFinalUpload} disabled={isUploading}>
                                {isUploading ? 'Uploading...' : 'Confirm & Upload'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                .form-control:focus {
                    border-color: var(--accent);
                    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
                }
            `}</style>
        </div>
    );
}
