import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Phone, Mail, FileText, Users } from 'lucide-react';
import { SalesService } from './SalesService';
import toast from 'react-hot-toast';

export default function LogFollowUpModal({ isOpen, onClose, leadId, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'Call',
        status: 'Completed',
        notes: '',
        scheduled_date: '',
        scheduled_time: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            const payload = {
                type: formData.type,
                status: formData.status,
                notes: formData.notes
            };

            if (formData.status === 'Completed') {
                payload.completed_at = new Date().toISOString();
            } else if (formData.status === 'Pending' || formData.status === 'Scheduled') {
                if (!formData.scheduled_date) {
                    toast.error('Scheduled date is required');
                    return;
                }
                const timeString = formData.scheduled_time || '10:00'; // Default to 10AM if time omitted
                payload.scheduled_at = new Date(`${formData.scheduled_date}T${timeString}`).toISOString();
                payload.status = 'Pending';
            }

            await SalesService.createFollowUp(leadId, payload);
            toast.success('Follow-up logged successfully');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to log follow-up:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to log follow-up';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Call': return <Phone size={16} />;
            case 'Callback': return <Phone size={16} />;
            case 'Email': return <Mail size={16} />;
            case 'Meeting': return <Users size={16} />;
            case 'Note': return <FileText size={16} />;
            default: return <FileText size={16} />;
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-md">
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">Log Interaction</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '4px' }}>Record client communication or a future callback.</p>
                    </div>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Interaction Type</label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-light)', pointerEvents: 'none', display: 'flex' }}>
                                        {getTypeIcon(formData.type)}
                                    </div>
                                    <select
                                        className="form-control"
                                        style={{ paddingLeft: '36px' }}
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="Call">Call</option>
                                        <option value="Callback">Callback</option>
                                        <option value="Email">Email</option>
                                        <option value="Meeting">Meeting</option>
                                        <option value="Note">Internal Note</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-control"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Completed">Completed Now</option>
                                    <option value="Scheduled">Scheduled (Future)</option>
                                </select>
                            </div>
                        </div>

                        {(formData.status === 'Scheduled' || formData.status === 'Pending') && (
                            <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '8px' }}>
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-light)', marginBottom: '12px', fontSize: '12px' }}>
                                    <CalendarIcon size={14} /> Schedule Date & Time
                                </label>
                                <div className="form-row">
                                    <div className="form-group">
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={formData.scheduled_date}
                                            onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={formData.scheduled_time}
                                            onChange={e => setFormData({ ...formData, scheduled_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Notes & Outcome</label>
                            <textarea
                                className="form-control"
                                rows={20}
                                style={{ resize: 'none' }}
                                placeholder="What was discussed? Next steps?"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '140px' }}>
                            {loading ? <div className="spinner-sm" style={{ width: 16, height: 16, borderTopColor: '#fff' }} /> : (
                                formData.status === 'Completed' ? 'Log Interaction' : 'Schedule Callback'
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
