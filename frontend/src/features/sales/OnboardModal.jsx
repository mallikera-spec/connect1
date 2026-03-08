import React, { useState, useEffect } from 'react';
import { X, Rocket, Calendar, Briefcase, FileText, CheckCircle } from 'lucide-react';
import { SalesService } from './SalesService';
import toast from 'react-hot-toast';

export default function OnboardModal({ isOpen, onClose, lead, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        deal_value: lead?.deal_value || 0,
        project_name: lead ? `${lead.company || lead.name} - Project` : '',
        description: '',
        sub_types: [],
        acquisition_date: new Date().toISOString().split('T')[0],
        due_date: '',
        days_committed: 20
    });

    // Auto-calculate Target Due Date
    useEffect(() => {
        if (formData.acquisition_date && formData.days_committed) {
            const date = new Date(formData.acquisition_date);
            date.setDate(date.getDate() + formData.days_committed);
            const calculatedDate = date.toISOString().split('T')[0];
            if (calculatedDate !== formData.due_date) {
                setFormData(prev => ({ ...prev, due_date: calculatedDate }));
            }
        }
    }, [formData.acquisition_date, formData.days_committed]);

    if (!isOpen) return null;

    const SUB_TYPES = [
        'Website', 'Android app', 'IOS app', 'Digital Marketing', 'Automations', 'Maintenance', 'AI/ML'
    ]

    const toggleSubType = (type) => {
        setFormData(prev => ({
            ...prev,
            sub_types: prev.sub_types.includes(type)
                ? prev.sub_types.filter(t => t !== type)
                : [...prev.sub_types, type]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.project_name) return toast.error('Project Name is required');
        if (formData.deal_value <= 0) return toast.error('Please enter a valid deal value');

        setLoading(true);
        try {
            await SalesService.onboardLead(lead.id, formData);
            toast.success('Lead onboarded successfully! Client and Project created.');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Onboarding failed:', error);
            toast.error(error.response?.data?.message || error.message || 'Failed to onboard lead');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-md">
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Rocket size={20} color="var(--accent-light)" /> Onboard Client
                        </h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '4px' }}>Finalize deal and initialize Project for <strong>{lead?.name}</strong>.</p>
                    </div>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Final Deal Value (Rs)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formData.deal_value}
                                    onChange={e => setFormData({ ...formData, deal_value: Number(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Acquisition Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={formData.acquisition_date}
                                    onChange={e => setFormData({ ...formData, acquisition_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Project Name</label>
                            <input
                                className="form-control"
                                placeholder="Descriptive project name"
                                value={formData.project_name}
                                onChange={e => setFormData({ ...formData, project_name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Project Service Types</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                                {SUB_TYPES.map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => toggleSubType(type)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            border: '1px solid var(--border)',
                                            background: formData.sub_types.includes(type) ? 'var(--accent)' : 'transparent',
                                            color: formData.sub_types.includes(type) ? 'white' : 'var(--text-dim)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Estimated Days</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formData.days_committed}
                                    onChange={e => setFormData({ ...formData, days_committed: Number(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Target Due Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={formData.due_date}
                                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Scope & Description</label>
                            <textarea
                                className="form-control"
                                rows={4}
                                placeholder="Primary requirements, technology stack, etc."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '160px' }}>
                            {loading ? <div className="spinner-sm" style={{ width: 16, height: 16, borderTopColor: '#fff' }} /> : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Rocket size={16} /> Complete Onboarding
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .spinner-sm {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-radius: 50%;
                    border-top-color: #fff;
                    animation: spin 0.8s linear infinite;
                    display: inline-block;
                    vertical-align: middle;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
