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
            case 'Call': return <Phone size={14} />;
            case 'Email': return <Mail size={14} />;
            case 'Meeting': return <Users size={14} />;
            case 'Note': return <FileText size={14} />;
            default: return <FileText size={14} />;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
            <div className="modal-content polished-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2>Log Follow-up Interaction</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label>Interaction Type</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none', display: 'flex' }}>
                                    {getTypeIcon(formData.type)}
                                </div>
                                <select
                                    className="form-control"
                                    style={{ paddingLeft: '32px' }}
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Call">Call</option>
                                    <option value="Email">Email</option>
                                    <option value="Meeting">Meeting</option>
                                    <option value="Note">Internal Note</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label>Status</label>
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
                        <div className="form-group" style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: 600 }}>
                                <CalendarIcon size={14} /> Schedule Follow-up
                            </label>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <div style={{ flex: 1 }}>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={formData.scheduled_date}
                                        onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
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

                    <div className="form-group mb-0">
                        <label>Notes & Outcomes</label>
                        <textarea
                            className="form-control"
                            rows={4}
                            placeholder="What was discussed? Next steps?"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            required
                        ></textarea>
                    </div>
                </form>

                <div className="modal-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Saving...' : formData.status === 'Completed' ? 'Log Interaction' : 'Schedule Follow-up'}
                    </button>
                </div>
            </div>
        </div>
    );
}
