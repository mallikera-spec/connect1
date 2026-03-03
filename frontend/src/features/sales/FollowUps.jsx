import { useState, useEffect } from 'react';
import {
    Calendar, Search, Filter, Phone, Mail, Users, FileText,
    ChevronLeft, ChevronRight, CheckCircle, ExternalLink, Clock, AlertCircle
} from 'lucide-react';
import { SalesService } from './SalesService';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

/**
 * FollowUps — Specialized page for tracking scheduled interactions across leads.
 */
export default function FollowUps() {
    const { user: currentUser, hasPermission } = useAuth();
    const navigate = useNavigate();

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

    // Role Checks
    const userRoles = currentUser?.roles?.map(r => typeof r === 'string' ? r.toLowerCase() : r.name?.toLowerCase()).filter(Boolean) || [];
    const isAdmin = userRoles.some(r => r && (r.includes('admin') || r.includes('manager') || r.includes('lead'))) ||
        (hasPermission && (hasPermission('manage_leads') || hasPermission('admin')));

    useEffect(() => {
        fetchAgents();
    }, []);

    useEffect(() => {
        fetchData();
    }, [agentFilter, statusFilter, dateRange]);

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

    const filteredFollowUps = followUps.filter(fu =>
        fu.lead?.name?.toLowerCase().includes(search.toLowerCase()) ||
        fu.lead?.company?.toLowerCase().includes(search.toLowerCase()) ||
        fu.notes?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="followups-page">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1>Follow-ups & Callbacks</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Manage all scheduled interactions and due dates.</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="card polished-card" style={{ padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} size={16} />
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
                            <input
                                type="date"
                                className="form-control"
                                style={{ width: '140px', height: '40px' }}
                                value={dateRange.start}
                                onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
                            />
                            <span style={{ color: 'var(--text-dim)' }}>-</span>
                            <input
                                type="date"
                                className="form-control"
                                style={{ width: '140px', height: '40px' }}
                                value={dateRange.end}
                                onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
                            />
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
                                <th>Due Date</th>
                                <th>Lead Information</th>
                                <th>Type</th>
                                <th>Interaction Notes</th>
                                {isAdmin && <th>Assigned To</th>}
                                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFollowUps.length > 0 ? filteredFollowUps.map(fu => {
                                const isOverdue = new Date(fu.scheduled_at) < new Date() && fu.status === 'Pending';
                                return (
                                    <tr key={fu.id} className="clickable-row">
                                        <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                color: isOverdue ? 'var(--danger)' : 'var(--text)',
                                                fontWeight: 600, fontSize: '13px'
                                            }}>
                                                {isOverdue && <AlertCircle size={14} />}
                                                {new Date(fu.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                                {new Date(fu.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
                                            <div style={{ fontWeight: 700, fontSize: '14px' }}>{fu.lead?.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{fu.lead?.company || 'No Company'}</div>
                                        </td>
                                        <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-light)' }}>
                                                {getIcon(fu.type)}
                                                <span style={{ fontSize: '12px', fontWeight: 600 }}>{fu.type}</span>
                                            </div>
                                        </td>
                                        <td style={{ verticalAlign: 'top', paddingTop: '16px', maxWidth: '300px' }}>
                                            <p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>
                                                {fu.notes || 'No instructions provided.'}
                                            </p>
                                        </td>
                                        {isAdmin && (
                                            <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
                                                <div style={{ fontSize: '13px' }}>{fu.agent?.full_name}</div>
                                            </td>
                                        )}
                                        <td style={{ textAlign: 'right', paddingRight: '24px', verticalAlign: 'top', paddingTop: '12px' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                {fu.status === 'Pending' && (
                                                    <button
                                                        className="btn btn-sm btn-ghost"
                                                        style={{ color: 'var(--success)' }}
                                                        onClick={() => handleComplete(fu)}
                                                        title="Mark Completed"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={() => navigate('/leads', { state: { leadId: fu.lead_id } })}
                                                    title="View Lead"
                                                >
                                                    <ExternalLink size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>
                                        <Clock size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.2 }} />
                                        No follow-ups found for the selected criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <style>{`
                .followups-page { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .clickable-row:hover { background: rgba(255,255,255,0.02) !important; }
                .filter-group { display: flex; flex-direction: column; }
            `}</style>
        </div>
    );
}
