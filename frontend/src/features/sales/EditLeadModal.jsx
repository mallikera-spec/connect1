import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { SalesService } from './SalesService';
import api from '../../lib/api';
import toast from 'react-hot-toast';

/**
 * EditLeadModal — Form for modifying existing lead details.
 */
export default function EditLeadModal({ leadId, onClose, onSaved }) {
    const [formData, setFormData] = useState(null);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (leadId) {
            fetchInitialData();
        }
    }, [leadId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [leadRes, usersRes] = await Promise.all([
                SalesService.getLead(leadId),
                api.get('/users', { params: { role: 'BDM,Admin,Super Admin' } })
            ]);
            setFormData(leadRes.data);
            setAgents(usersRes.data.data);
        } catch (err) {
            toast.error('Failed to load lead data');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.phone) return toast.error('Phone number is required');

        setIsSaving(true);
        try {
            await SalesService.updateLead(leadId, formData);
            toast.success('Lead updated successfully');
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.message || 'Failed to update lead');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return (
        <div className="modal-overlay">
            <div className="modal modal-md"><div className="spinner" /></div>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-md">
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">Edit Lead: {formData.name}</h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Update lead contact and pipeline information.</p>
                    </div>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ gap: '20px' }}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                className="form-control"
                                placeholder="e.g. John Doe"
                                value={formData.name || ''}
                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Company Name</label>
                                <input
                                    className="form-control"
                                    placeholder="e.g. Acme Corp"
                                    value={formData.company || ''}
                                    onChange={e => setFormData(p => ({ ...p, company: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Lead Source</label>
                                <select
                                    className="form-control"
                                    value={formData.source || 'Other'}
                                    onChange={e => setFormData(p => ({ ...p, source: e.target.value }))}
                                >
                                    <option value="Organic">Organic</option>
                                    <option value="Email">Email</option>
                                    <option value="FB">FB</option>
                                    <option value="Google">Google</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="john@example.com"
                                    value={formData.email || ''}
                                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone Number *</label>
                                <input
                                    className="form-control"
                                    placeholder="+1 (555) 000-0000"
                                    value={formData.phone || ''}
                                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Sales Stage</label>
                                <select
                                    className="form-control"
                                    value={formData.status || 'New'}
                                    onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                                >
                                    <option value="New">New Lead</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Proposal">Proposal Sent</option>
                                    <option value="Won">Won</option>
                                    <option value="Lost">Lost</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Proposal Value ($)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="0.00"
                                    value={formData.deal_value || 0}
                                    onChange={e => setFormData(p => ({ ...p, deal_value: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Potential Score ({formData.score}/10)</label>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                {[...Array(10)].map((_, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setFormData(p => ({ ...p, score: i + 1 }))}
                                        style={{
                                            flex: 1,
                                            height: '8px',
                                            borderRadius: '4px',
                                            background: (i + 1) <= formData.score ? 'var(--accent)' : 'var(--bg-app)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            border: '1px solid var(--border)'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Assign Agent</label>
                            <select
                                className="form-control"
                                value={formData.assigned_agent_id || ''}
                                onChange={e => setFormData(p => ({ ...p, assigned_agent_id: e.target.value }))}
                            >
                                <option value="">Unassigned</option>
                                {agents.map(agent => (
                                    <option key={agent.id} value={agent.id}>{agent.full_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="modal-footer" style={{ background: 'var(--bg-card)' }}>
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSaving}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                            {isSaving ? 'Saving...' : <><Save size={16} /> Update Lead</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
