import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { SalesService } from './SalesService';
import toast from 'react-hot-toast';

export default function BulkStatusModal({ isOpen, onClose, onSuccess, leadIds }) {
    const [status, setStatus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const statuses = ['New', 'Contacted', 'Meeting', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Invalid', 'Not Connected'];

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!status) {
            toast.error('Please select a status');
            return;
        }
        setIsSubmitting(true);
        try {
            await SalesService.bulkUpdateLeadsStatus(leadIds, status);
            toast.success(`${leadIds.length} leads updated to ${status}`);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-sm">
                <div className="modal-header">
                    <h2 className="modal-title">Bulk Update Status</h2>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '13px', margin: 0 }}>
                                Update <strong>{leadIds.length}</strong> selected leads to:
                            </p>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Select Status</label>
                            <select
                                className="form-select"
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                            >
                                <option value="">-- Select Status --</option>
                                {statuses.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Updating...' : 'Update Status'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
