import { useState, useEffect } from 'react';
import { X, Save, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SalesService } from './SalesService';
import api from '../../lib/api';
import toast from 'react-hot-toast';

/**
 * NewLeadModal — Form for manual lead entry.
 */
export default function NewLeadModal({ onClose, onSaved }) {
    const { user: currentUser } = useAuth();

    // Role Checks
    const isAdmin = currentUser?.roles?.includes('Super Admin') || currentUser?.roles?.includes('Sales Manager');
    const isBDM = currentUser?.roles?.includes('BDM') && !isAdmin;

    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        source: 'LinkedIn',
        status: 'New',
        score: 5,
        deal_value: 0,
        assigned_agent_id: isBDM ? currentUser.id : ''
    });
    const [agents, setAgents] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            // Fetch strictly BDMs and Admins as requested
            const res = await api.get('/users', { params: { role: 'BDM,Admin,Super Admin' } });
            setAgents(res.data.data);
        } catch (err) {
            console.error('Failed to fetch agents:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.phone) return toast.error('Phone number is required');

        setIsSaving(true);
        try {
            await SalesService.createLead(formData);
            toast.success('Lead created successfully');
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.message || 'Failed to create lead');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-md">
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">Add New Lead</h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Manually enter prospective client details.</p>
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
                                value={formData.name}
                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                autoFocus
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Company Name</label>
                                <input
                                    className="form-control"
                                    placeholder="e.g. Acme Corp"
                                    value={formData.company}
                                    onChange={e => setFormData(p => ({ ...p, company: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Lead Source</label>
                                <select
                                    className="form-control"
                                    value={formData.source}
                                    onChange={e => setFormData(p => ({ ...p, source: e.target.value }))}
                                >
                                    <option value="LinkedIn">LinkedIn</option>
                                    <option value="Referral">Referral</option>
                                    <option value="Website">Website</option>
                                    <option value="Cold Call">Cold Call</option>
                                    <option value="Event">Event</option>
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
                                    value={formData.email}
                                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone Number *</label>
                                <input
                                    className="form-control"
                                    placeholder="+1 (555) 000-0000"
                                    value={formData.phone}
                                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Sales Stage</label>
                                <select
                                    className="form-control"
                                    value={formData.status}
                                    onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                                >
                                    <option value="New">New Lead</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Proposal">Proposal Sent</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Deal Value ($)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="0.00"
                                    value={formData.deal_value}
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

                        <div className="form-group" style={{ opacity: isBDM ? 0.6 : 1 }}>
                            <label className="form-label">Assign Agent</label>
                            <select
                                className="form-control"
                                value={formData.assigned_agent_id}
                                onChange={e => setFormData(p => ({ ...p, assigned_agent_id: e.target.value }))}
                                disabled={isBDM}
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
                            {isSaving ? 'Creating...' : <><Save size={16} /> Save Lead</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
