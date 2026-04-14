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

    // Role Checks - Directors are also allowed to assign agents
    const isAdmin = currentUser?.roles?.some(r => ['Super Admin', 'Sales Manager', 'Director'].includes(r));
    const isBDM = currentUser?.roles?.includes('BDM') && !isAdmin;

    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        alt_phone: '',
        location: '',
        source: 'LinkedIn',
        status: 'New',
        score: 5,
        deal_value: 0,
        assigned_agent_id: isBDM ? currentUser.id : '',
        interaction_note: ''
    });

    useEffect(() => {
        setFormData({
            name: '',
            company: '',
            email: '',
            phone: '',
            alt_phone: '',
            location: '',
            source: 'LinkedIn',
            status: 'New',
            score: 5,
            deal_value: 0,
            assigned_agent_id: isBDM ? currentUser.id : '',
            interaction_note: ''
        });
    }, []); // Runs once on mount
    const [agents, setAgents] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            // Fetch strictly BDMs, Admins, and Directors
            const res = await api.get('/users', { params: { role: 'BDM,Admin,Super Admin,Director' } });
            setAgents(res.data.data);
        } catch (err) {
            console.error('Failed to fetch agents:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic Validations
        if (!formData.name?.trim()) return toast.error('Full Name is required');
        if (/^\d+$/.test(formData.name)) return toast.error('Full Name cannot be purely numeric');
        
        // Strict Phone Validation (Rule #19)
        const phoneRegex = /^\+?[0-9\s-]{10,20}$/;
        if (!formData.phone?.trim()) return toast.error('Phone number is required');
        if (!phoneRegex.test(formData.phone)) return toast.error('Invalid phone number format (needs 10-20 digits)');
        
        if (formData.alt_phone && !phoneRegex.test(formData.alt_phone)) {
            return toast.error('Invalid alternate phone number format');
        }

        setIsSaving(true);
        try {
            // Check for duplicates first
            const { duplicate } = await SalesService.checkDuplicateLead({
                phone: formData.phone,
                alt_phone: formData.alt_phone
            });

            if (duplicate) {
                const agentName = duplicate.assigned_agent?.full_name || 'Unassigned';
                toast.error(`Duplicate lead, lead already assigned to =>${agentName}`, {
                    duration: 5000,
                    position: 'top-center'
                });
                setIsSaving(false);
                return;
            }

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

                            <div className="form-group">
                                <label className="form-label">Alt Phone Number</label>
                                <input
                                    className="form-control"
                                    placeholder="+1 (555) 000-0001"
                                    value={formData.alt_phone}
                                    onChange={e => setFormData(p => ({ ...p, alt_phone: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Client Location</label>
                                <input
                                    className="form-control"
                                    placeholder="e.g. Mumbai, Delhi, Bangalore"
                                    value={formData.location}
                                    onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
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
                                    <option value="Meeting">Meeting Scheduled</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Proposal">Proposal Sent</option>
                                    <option value="Negotiation">Negotiation</option>
                                    <option value="Won">Won</option>
                                    <option value="Lost">Lost</option>
                                    <option value="Invalid">Invalid Lead</option>
                                    <option value="Not Connected">Not Connected</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Deal Value (Rs)</label>
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

                        {!isBDM && (
                            <div className="form-group">
                                <label className="form-label">Assign Agent</label>
                                <select
                                    className="form-control"
                                    value={formData.assigned_agent_id}
                                    onChange={e => setFormData(p => ({ ...p, assigned_agent_id: e.target.value }))}
                                >
                                    <option value="">Unassigned</option>
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.id}>{agent.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="form-group" style={{ marginTop: '10px' }}>
                            <label className="form-label">Initial Interaction Note</label>
                            <textarea
                                className="form-control"
                                placeholder="Details of the first contact..."
                                value={formData.interaction_note}
                                onChange={e => setFormData(p => ({ ...p, interaction_note: e.target.value }))}
                                rows={3}
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
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
