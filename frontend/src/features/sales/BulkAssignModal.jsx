import React, { useState } from 'react';
import { X, UserPlus, CheckCircle } from 'lucide-react';
import { SalesService } from './SalesService';
import toast from 'react-hot-toast';

export default function BulkAssignModal({ isOpen, onClose, onSuccess, leadIds, agents }) {
    const [assignedAgentId, setAssignedAgentId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await SalesService.bulkAssignLeads(leadIds, assignedAgentId || null);
            toast.success(`${leadIds.length} leads assigned successfully`);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign leads');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-sm">
                <div className="modal-header">
                    <h2 className="modal-title">Bulk Assign Agents</h2>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '13px', margin: 0 }}>
                                Assign <strong>{leadIds.length}</strong> selected leads to:
                            </p>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Select Agent</label>
                            <select
                                className="form-select"
                                value={assignedAgentId}
                                onChange={e => setAssignedAgentId(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                            >
                                <option value="">-- Unassigned --</option>
                                {agents.map(agent => (
                                    <option key={agent.id} value={agent.id}>{agent.full_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
