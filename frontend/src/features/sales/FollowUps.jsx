import React, { useState, useEffect } from 'react';
import {
    Calendar, Search, Filter, Phone, Mail, Users, FileText,
    ChevronLeft, ChevronRight, CheckCircle, ExternalLink, Clock, AlertCircle, Edit2, X, Trash2,
    ChevronDown as ChevronDownIcon, ChevronUp as ChevronUpIcon
} from 'lucide-react';
import { SalesService } from './SalesService';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import LeadDetailsModal from './LeadDetailsModal';

/**
 * EditFollowUpModal — Inline modal to edit an existing follow-up.
 */
function EditFollowUpModal({ followUp, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        type: followUp.type || 'Call',
        status: followUp.status || 'Pending',
        notes: followUp.notes || '',
        scheduled_date: followUp.scheduled_at ? followUp.scheduled_at.split('T')[0] : '',
        scheduled_time: followUp.scheduled_at ? followUp.scheduled_at.split('T')[1]?.slice(0, 5) : '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { type: form.type, status: form.status, notes: form.notes };
            if (form.status === 'Completed') {
                payload.completed_at = new Date().toISOString();
            } else if (form.scheduled_date) {
                const timeString = form.scheduled_time || '10:00';
                payload.scheduled_at = new Date(`${form.scheduled_date}T${timeString}`).toISOString();
            }
            await SalesService.updateFollowUp(followUp.lead_id, followUp.id, payload);
            toast.success('Follow-up updated');
            onSuccess?.();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update follow-up');
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Call': case 'Callback': return <Phone size={16} />;
            case 'Email': return <Mail size={16} />;
            case 'Meeting': return <Users size={16} />;
            default: return <FileText size={16} />;
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-md">
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">Edit Follow-up</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '4px' }}>
                            {followUp.lead?.name} — {followUp.lead?.company || 'No Company'}
                        </p>
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
                                        {getTypeIcon(form.type)}
                                    </div>
                                    <select
                                        className="form-control"
                                        style={{ paddingLeft: '36px' }}
                                        value={form.type}
                                        onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
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
                                    value={form.status}
                                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-light)', marginBottom: '12px', fontSize: '12px' }}>
                                <Calendar size={14} /> Scheduled Date &amp; Time
                            </label>
                            <div className="form-row">
                                <div className="form-group">
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={form.scheduled_date}
                                        onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="time"
                                        className="form-control"
                                        value={form.scheduled_time}
                                        onChange={e => setForm(p => ({ ...p, scheduled_time: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notes &amp; Outcome</label>
                            <textarea
                                className="form-control"
                                rows={4}
                                style={{ resize: 'vertical' }}
                                placeholder="What was discussed? Next steps?"
                                value={form.notes}
                                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                required
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '120px' }}>
                            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/**
 * ExpandableNote — Helper to show "Read More" for long text.
 */
function ExpandableNote({ text, limit = 100 }) {
    const [expanded, setExpanded] = React.useState(false);
    if (!text) return <span style={{ opacity: 0.3 }}>No notes provided.</span>;
    if (text.length <= limit) return <span>{text}</span>;

    return (
        <span>
            {expanded ? text : `${text.slice(0, limit)}... `}
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                style={{
                    background: 'none', border: 'none', color: 'var(--accent-light)',
                    cursor: 'pointer', fontSize: '11px', fontWeight: 700,
                    padding: '0 4px', textTransform: 'uppercase'
                }}
            >
                {expanded ? 'Read Less' : 'Read More'}
            </button>
        </span>
    );
}

/**
 * FollowUps — Specialized page for tracking scheduled interactions across leads.
 */
export default function FollowUps() {
    const { user: currentUser, hasPermission } = useAuth();

    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allAgents, setAllAgents] = useState([]);

    // Filters
    const [agentFilter, setAgentFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('Pending');
    const [search, setSearch] = useState('');
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]
    });

    // Modal state — inline, no navigation
    const [viewLeadId, setViewLeadId] = useState(null);
    const [editingFollowUp, setEditingFollowUp] = useState(null);
    const [expandedLeadIds, setExpandedLeadIds] = useState({});

    // Role Checks
    const userRoles = currentUser?.roles?.map(r => typeof r === 'string' ? r.toLowerCase() : r.name?.toLowerCase()).filter(Boolean) || [];
    const isAdmin = userRoles.some(r => r && (r.includes('admin') || r.includes('manager') || r.includes('lead'))) ||
        (hasPermission && (hasPermission('manage_leads') || hasPermission('admin')));

    useEffect(() => { fetchAgents(); }, []);
    useEffect(() => { fetchData(); }, [agentFilter, statusFilter, dateRange]);

    const fetchAgents = async () => {
        if (!isAdmin) return;
        try {
            const res = await api.get('/users', { params: { role: 'BDM,Admin,Super Admin' } });
            setAllAgents(res.data.data);
        } catch (err) { console.error(err); }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                agent_id: agentFilter,
                status: statusFilter,
                startDate: dateRange.start,
                endDate: dateRange.end
            };
            const res = await SalesService.getFollowUps(params);
            setFollowUps(res.data || []);
        } catch (err) {
            toast.error('Failed to fetch follow-ups');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (fu) => {
        if (!window.confirm('Mark this follow-up as completed?')) return;
        try {
            await SalesService.updateFollowUp(fu.lead_id, fu.id, {
                status: 'Completed',
                completed_at: new Date().toISOString()
            });
            toast.success('Follow-up completed');
            fetchData();
        } catch (err) {
            toast.error('Failed to update follow-up');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Call': return <Phone size={16} />;
            case 'Callback': return <Phone size={16} />;
            case 'Email': return <Mail size={16} />;
            case 'Meeting': return <Users size={16} />;
            default: return <FileText size={16} />;
        }
    };

    const handleDeleteFollowUp = async (fu) => {
        if (!window.confirm('Delete this follow-up? This action cannot be undone.')) return;
        try {
            await SalesService.deleteFollowUp(fu.lead_id, fu.id);
            toast.success('Follow-up deleted');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete follow-up');
        }
    };

    const filteredFollowUps = followUps.filter(fu =>
        fu.lead?.name?.toLowerCase().includes(search.toLowerCase()) ||
        fu.lead?.company?.toLowerCase().includes(search.toLowerCase()) ||
        fu.notes?.toLowerCase().includes(search.toLowerCase())
    );

    // Grouping Logic
    const groupedFollowUps = filteredFollowUps.reduce((acc, fu) => {
        const lid = fu.lead_id;
        if (!acc[lid]) {
            acc[lid] = {
                lead: fu.lead,
                agent: fu.agent,
                items: []
            };
        }
        acc[lid].items.push(fu);
        return acc;
    }, {});

    // Sort groups by earliest scheduled date in each group
    const sortedGroups = Object.values(groupedFollowUps).sort((a, b) => {
        const minA = Math.min(...a.items.map(i => new Date(i.scheduled_at).getTime()));
        const minB = Math.min(...b.items.map(i => new Date(i.scheduled_at).getTime()));
        return minA - minB;
    });

    const toggleLead = (leadId) => {
        setExpandedLeadIds(prev => ({ ...prev, [leadId]: !prev[leadId] }));
    };

    return (
        <div className="followups-page">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1>Follow-ups &amp; Callbacks</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Manage all scheduled interactions and due dates.</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="card polished-card" style={{ padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>


                        <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Search</label>



                        {/* <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} size={16} /> */}
                        <input
                            type="text"
                            placeholder="Search by lead or notes..."
                            className="form-control"
                            style={{ paddingLeft: '36px' }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {isAdmin && (
                        <div className="filter-group">
                            <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Agent</label>
                            <select
                                className="form-control"
                                style={{ height: '40px', width: '180px' }}
                                value={agentFilter}
                                onChange={e => setAgentFilter(e.target.value)}
                            >
                                <option value="">All BDMs</option>
                                {allAgents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="filter-group">
                        <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Status</label>
                        <select
                            className="form-control"
                            style={{ height: '40px', width: '140px' }}
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                            <option value="">All Status</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Due Date Range</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="date" className="form-control" style={{ width: '140px', height: '40px' }} value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} />
                            <span style={{ color: 'var(--text-dim)' }}>-</span>
                            <input type="date" className="form-control" style={{ width: '140px', height: '40px' }} value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="card polished-card" style={{ padding: '60px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
            ) : (
                <div className="card polished-card" style={{ padding: 0 }}>
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px', paddingLeft: '24px' }}>S.No</th>
                                <th style={{ width: '150px' }}>Due Date</th>
                                <th style={{ width: '220px' }}>Lead Information</th>
                                <th style={{ width: '150px' }}>Phone</th>
                                <th style={{ width: '120px' }}>Type</th>
                                <th>Interaction Notes</th>
                                {isAdmin && <th style={{ width: '150px' }}>Assigned To</th>}
                                <th style={{ textAlign: 'right', paddingRight: '24px', width: '140px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedGroups.length > 0 ? sortedGroups.map((group, index) => {
                                const lead = group.lead;
                                const items = group.items;
                                const isExpanded = expandedLeadIds[lead.id];
                                const hasMultiple = items.length > 1;

                                if (!hasMultiple) {
                                    // Single Interaction: Just show 1 unified row
                                    const fu = items[0];
                                    const isOverdue = new Date(fu.scheduled_at) < new Date() && fu.status === 'Pending';
                                    return (
                                        <tr key={fu.id} className="interaction-row clickable-row">
                                            <td style={{ paddingLeft: '24px', fontWeight: 600, color: 'var(--text-dim)' }}>
                                                {index + 1}
                                            </td>
                                            <td>
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    color: isOverdue ? 'var(--danger)' : 'var(--text)',
                                                    fontWeight: 600, fontSize: '12px'
                                                }}>
                                                    {isOverdue && <AlertCircle size={12} />}
                                                    {new Date(fu.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </div>
                                                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                                    {new Date(fu.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text)' }}>{lead.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{lead.company || '--'}</div>
                                            </td>
                                            <td>
                                                {lead.phone ? (
                                                    <span style={{ fontSize: '13px', color: 'var(--accent-light)', fontWeight: 600 }}>
                                                        {lead.phone}
                                                    </span>
                                                ) : (
                                                    <span style={{ opacity: 0.3 }}>--</span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-light)' }}>
                                                    {getIcon(fu.type)}
                                                    <span style={{ fontSize: '11px', fontWeight: 600 }}>{fu.type}</span>
                                                </div>
                                            </td>
                                            <td style={{ maxWidth: '300px' }}>
                                                <p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>
                                                    {fu.notes || 'No notes provided.'}
                                                </p>
                                            </td>
                                            {isAdmin && (
                                                <td>
                                                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{group.agent?.full_name}</div>
                                                </td>
                                            )}
                                            <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                    <button className="btn btn-sm btn-ghost" onClick={() => setEditingFollowUp(fu)} title="Edit"><Edit2 size={13} /></button>
                                                    {fu.status === 'Pending' && <button className="btn btn-sm btn-ghost" style={{ color: 'var(--success)' }} onClick={() => handleComplete(fu)} title="Complete"><CheckCircle size={13} /></button>}
                                                    <button className="btn btn-sm btn-ghost" onClick={() => setViewLeadId(lead.id)} title="View Lead"><ExternalLink size={13} /></button>
                                                    <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteFollowUp(fu)} title="Delete"><Trash2 size={13} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }

                                return (
                                    <React.Fragment key={lead.id}>
                                        {/* Lead Header Row (Multi-interaction only) */}
                                        <tr className="lead-header-row" onClick={() => toggleLead(lead.id)} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.03)' }}>
                                            <td style={{ paddingLeft: '24px', fontWeight: 600, color: 'var(--text-dim)' }}>
                                                {index + 1}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {isExpanded ? <ChevronUpIcon size={16} color="var(--accent)" /> : <ChevronDownIcon size={16} color="var(--accent)" />}
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>
                                                            {new Date(Math.min(...items.map(i => new Date(i.scheduled_at)))).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                        </span>
                                                        <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 800 }}>GROUP</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text)' }}>
                                                    {lead.name}
                                                    <span style={{ fontSize: '9px', background: 'var(--accent)', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 800, marginLeft: '8px', verticalAlign: 'middle' }}>
                                                        {items.length}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{lead.company || '--'}</div>
                                            </td>
                                            <td>
                                                {lead.phone ? (
                                                    <span style={{ fontSize: '13px', color: 'var(--accent-light)', fontWeight: 600 }}>
                                                        {lead.phone}
                                                    </span>
                                                ) : (
                                                    <span style={{ opacity: 0.3 }}>--</span>
                                                )}
                                            </td>
                                            <td><span style={{ opacity: 0.2 }}>--</span></td>
                                            <td>
                                                {/* Summary of the most recent note in the group */}
                                                <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                                    <ExpandableNote text={items.sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))[0]?.notes} limit={60} />
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td>
                                                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{group.agent?.full_name}</div>
                                                </td>
                                            )}
                                            <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={(e) => { e.stopPropagation(); setViewLeadId(lead.id); }}
                                                    title="View Lead Details"
                                                >
                                                    <ExternalLink size={14} />
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Interaction Rows - Latest on Top */}
                                        {isExpanded && items.sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at)).map(fu => {
                                            const isOverdue = new Date(fu.scheduled_at) < new Date() && fu.status === 'Pending';
                                            return (
                                                <tr key={fu.id} className="interaction-row" style={{ borderLeft: '3px solid var(--accent)' }}>
                                                    <td></td>
                                                    <td style={{ paddingLeft: '24px' }}>
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            color: isOverdue ? 'var(--danger)' : 'var(--text)',
                                                            fontWeight: 600, fontSize: '12px'
                                                        }}>
                                                            {isOverdue && <AlertCircle size={12} />}
                                                            {new Date(fu.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                                                            {new Date(fu.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-dim)', opacity: 0.7 }}>
                                                            Interaction Detail
                                                        </div>
                                                    </td>
                                                    <td><span style={{ opacity: 0.3 }}>--</span></td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-light)' }}>
                                                            {getIcon(fu.type)}
                                                            <span style={{ fontSize: '12px', fontWeight: 600 }}>{fu.type}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ maxWidth: '300px' }}>
                                                        <p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>
                                                            <ExpandableNote text={fu.notes} />
                                                        </p>
                                                    </td>
                                                    {isAdmin && <td></td>}
                                                    <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                            <button
                                                                className="btn btn-sm btn-ghost"
                                                                style={{ color: 'var(--accent-light)', padding: '4px' }}
                                                                onClick={() => setEditingFollowUp(fu)}
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={13} />
                                                            </button>
                                                            {fu.status === 'Pending' && (
                                                                <button
                                                                    className="btn btn-sm btn-ghost"
                                                                    style={{ color: 'var(--success)', padding: '4px' }}
                                                                    onClick={() => handleComplete(fu)}
                                                                    title="Complete"
                                                                >
                                                                    <CheckCircle size={13} />
                                                                </button>
                                                            )}
                                                            <button
                                                                className="btn btn-sm btn-ghost"
                                                                style={{ color: 'var(--danger)', padding: '4px' }}
                                                                onClick={() => handleDeleteFollowUp(fu)}
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                );

                            }) : (
                                <tr>
                                    <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>
                                        <Clock size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.2 }} />
                                        No follow-ups found for the selected criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Lead Details Modal — inline, closing stays on Follow-ups page */}
            {viewLeadId && (
                <LeadDetailsModal
                    leadId={viewLeadId}
                    onClose={() => setViewLeadId(null)}
                    onSaved={fetchData}
                />
            )}

            {/* Edit Follow-up Modal */}
            {editingFollowUp && (
                <EditFollowUpModal
                    followUp={editingFollowUp}
                    onClose={() => setEditingFollowUp(null)}
                    onSuccess={fetchData}
                />
            )}

            <style>{`
                .followups-page { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .interaction-row:hover { background: rgba(255,255,255,0.02) !important; }
                .lead-header-row:hover { background: rgba(255,255,255,0.06) !important; }
                .filter-group { display: flex; flex-direction: column; }
            `}</style>
        </div>
    );
}
