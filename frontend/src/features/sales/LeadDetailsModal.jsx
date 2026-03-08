import { useState, useEffect } from 'react';
import { X, Phone, Mail, MessageSquare, Plus, Save, History, TrendingUp, Rocket } from 'lucide-react';
import { SalesService } from './SalesService';
import toast from 'react-hot-toast';
import LogFollowUpModal from './LogFollowUpModal';
import LeadJourneyView from './LeadJourneyView';
import OnboardModal from './OnboardModal';
import LeadFilesTab from './LeadFilesTab';
import { FolderOpen } from 'lucide-react';

/**
 * LeadDetailsModal — Detailed view for a single lead with interaction history.
 */
export default function LeadDetailsModal({ leadId, onClose, onSaved }) {
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('timeline');
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [dealValue, setDealValue] = useState(0);

    useEffect(() => {
        if (leadId) loadLeadDetails();
    }, [leadId]);

    const loadLeadDetails = async () => {
        setLoading(true);
        try {
            const res = await SalesService.getLead(leadId);
            setLead(res.data);
            setDealValue(res.data.deal_value || 0);
        } catch (err) {
            toast.error('Failed to load lead details');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (newStatus === 'Won') {
            setIsOnboardModalOpen(true);
            return;
        }

        try {
            await SalesService.updateLead(leadId, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
            loadLeadDetails();
            onSaved();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await SalesService.updateLead(leadId, { deal_value: dealValue });
            toast.success('Lead details saved');
            loadLeadDetails();
        } catch (err) {
            toast.error(err.message);
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
            <div className="modal modal-lg">
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="user-avatar" style={{ width: '48px', height: '48px', margin: 0, fontSize: '18px' }}>
                            {lead.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="modal-title" style={{ fontSize: '20px' }}>{lead.name}</h2>
                            <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                {lead.company || 'Direct Client'} • Lead since {new Date(lead.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="tabs" style={{ margin: '0 24px', marginTop: '16px' }}>
                    <button className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
                        <History size={14} style={{ marginRight: '6px' }} /> Interaction Timeline
                    </button>
                    <button className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
                        <TrendingUp size={14} style={{ marginRight: '6px' }} /> Lead Profile
                    </button>
                    <button className={`tab-btn ${activeTab === 'journey' ? 'active' : ''}`} onClick={() => setActiveTab('journey')}>
                        <TrendingUp size={14} style={{ marginRight: '6px' }} /> Full Journey
                    </button>
                    <button className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
                        <FolderOpen size={14} style={{ marginRight: '6px' }} /> Files
                    </button>
                </div>

                <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    {activeTab === 'journey' && <LeadJourneyView leadId={leadId} />}
                    {activeTab === 'files' && <LeadFilesTab leadId={leadId} />}
                    {activeTab === 'timeline' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Interaction History</h3>
                                <button className="btn btn-primary" onClick={() => setIsLogModalOpen(true)}>
                                    <Plus size={16} /> Log Follow-up
                                </button>
                            </div>

                            {/* Timeline List */}
                            <div className="timeline" style={{ paddingLeft: '8px' }}>
                                {lead.follow_ups?.length > 0 ? lead.follow_ups.map((fu, idx) => (
                                    <div key={fu.id} style={{ display: 'flex', gap: '20px', position: 'relative', paddingBottom: '24px' }}>
                                        {idx !== lead.follow_ups.length - 1 && (
                                            <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: 0, width: '2px', background: 'var(--border)', opacity: 0.5 }} />
                                        )}
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: '#7c3aed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 1,
                                            flexShrink: 0,
                                            boxShadow: '0 0 0 4px var(--bg-card)'
                                        }}>
                                            {fu.type === 'Call' && <Phone size={12} color="#fff" />}
                                            {fu.type === 'Callback' && <Phone size={12} color="#fff" />}
                                            {fu.type === 'Email' && <Mail size={12} color="#fff" />}
                                            {fu.type === 'Meeting' && <MessageSquare size={12} color="#fff" />}
                                            {fu.type === 'Note' && <Plus size={12} color="#fff" />}
                                        </div>
                                        <div className="card polished-card" style={{ flex: 1, padding: '16px', marginTop: '-4px', borderLeft: (fu.type === 'Call' || fu.type === 'Callback') ? '4px solid var(--warning)' : 'none' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>
                                                    {fu.type} {fu.status === 'Pending' ? '(Scheduled)' : ''}
                                                </span>
                                                <span style={{ fontSize: '11px', color: fu.status === 'Pending' ? 'var(--warning)' : 'var(--text-dim)' }}>
                                                    {fu.status === 'Pending' ? `Due: ${new Date(fu.scheduled_at).toLocaleString()}` : new Date(fu.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>{fu.notes}</p>
                                            {fu.status === 'Pending' && (
                                                <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 600, color: 'var(--warning)' }}>
                                                    Pending Callback
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
                                        <History size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                        <p>No activity recorded for this lead yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'details' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                            <div className="card polished-card" style={{ padding: '20px' }}>
                                <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '20px', letterSpacing: '1px' }}>Core Information</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className="info-group">
                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Full Name</label>
                                        <div style={{ fontWeight: 600 }}>{lead.name}</div>
                                    </div>
                                    <div className="info-group">
                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Company</label>
                                        <div style={{ fontWeight: 600 }}>{lead.company || '--'}</div>
                                    </div>
                                    <div className="info-group">
                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Email Address</label>
                                        <div style={{ fontWeight: 600, color: '#7c3aed' }}>{lead.email || '--'}</div>
                                    </div>
                                    <div className="info-group">
                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Phone Number</label>
                                        <div style={{ fontWeight: 600 }}>{lead.phone || '--'}</div>
                                    </div>
                                    <div className="info-group">
                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Alt Phone Number</label>
                                        <div style={{ fontWeight: 600 }}>{lead.alt_phone || '--'}</div>
                                    </div>
                                    <div className="info-group">
                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Location</label>
                                        <div style={{ fontWeight: 600 }}>{lead.location || '--'}</div>
                                    </div>
                                </div>
                            </div>


                            <div className="card polished-card" style={{ padding: '20px' }}>
                                <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '20px', letterSpacing: '1px' }}>Lead Lifecycle</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px' }}>Deal Value (Rs)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Enter final deal value"
                                            value={dealValue}
                                            onChange={e => setDealValue(Number(e.target.value))}
                                            style={{ height: '40px', fontWeight: 600 }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px' }}>Current Sales Stage</label>
                                        <select
                                            className="form-control"
                                            value={lead.status}
                                            onChange={e => handleUpdateStatus(e.target.value)}
                                            style={{ height: '40px', fontWeight: 600 }}
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
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px' }}>Lead Quality Score</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)' }}>{lead.score}</span>
                                            <span style={{ color: 'var(--text-dim)' }}>/ 10</span>
                                            <div style={{ flex: 1, height: '8px', background: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${lead.score * 10}%`, height: '100%', background: '#7c3aed' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Assigned Account Manager</label>
                                        <div style={{ fontWeight: 600 }}>{lead.assigned_agent?.full_name || 'Unassigned'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-primary" onClick={handleSaveChanges} disabled={isSaving || !lead}>
                        {isSaving ? 'Saving...' : <><Save size={16} style={{ marginRight: '8px' }} /> Save Changes</>}
                    </button>
                    <button className="btn btn-ghost" onClick={onClose}>Close</button>
                </div>
            </div>

            <LogFollowUpModal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                leadId={leadId}
                onSuccess={loadLeadDetails}
            />

            <OnboardModal
                isOpen={isOnboardModalOpen}
                onClose={() => setIsOnboardModalOpen(false)}
                lead={{ ...lead, deal_value: dealValue }}
                onSuccess={() => {
                    loadLeadDetails();
                    if (onClose) onClose(); // Close details modal too? Or keep it? Usually onboarding is a terminal step for lead
                }}
            />
        </div>
    );
}
