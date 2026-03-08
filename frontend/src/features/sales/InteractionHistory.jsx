import { useState, useEffect } from 'react';
import {
    Calendar, Search, Filter, Phone, Mail, Users, FileText,
    ChevronLeft, ChevronRight, Download, Clock, CheckCircle, Target, LayoutGrid, Eye
} from 'lucide-react';
import { SalesService } from './SalesService';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import LeadDetailsModal from './LeadDetailsModal';
import DateRangePicker from '../../components/DateRangePicker';

const ExpandableNote = ({ text }) => {
    const [expanded, setExpanded] = useState(false);
    if (!text || text.length < 150) return <span>{text || 'No notes recorded.'}</span>;
    return (
        <div>
            <span>{expanded ? text : `${text.substring(0, 150)}...`} </span>
            <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                style={{
                    background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer',
                    fontSize: '11px', fontWeight: 700, padding: 0, textTransform: 'uppercase', display: 'inline'
                }}
            >
                {expanded ? 'Show Less' : 'Read More'}
            </button>
        </div>
    );
};

/**
 * InteractionHistory — Comprehensive log of all past BDM-Client interactions.
 */
export default function InteractionHistory() {
    const { user: currentUser, hasPermission } = useAuth();
    const [interactions, setInteractions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allAgents, setAllAgents] = useState([]);

    // Filters
    const [agentFilter, setAgentFilter] = useState('');
    const [search, setSearch] = useState('');
    const [leadStatusFilter, setLeadStatusFilter] = useState('');
    const [expandedLeads, setExpandedLeads] = useState(new Set());
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [selectedLeadId, setSelectedLeadId] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [page, setPage] = useState(1);
    const limit = 50;

    // Role Checks
    const userRoles = currentUser?.roles?.map(r => typeof r === 'string' ? r.toLowerCase() : r.name?.toLowerCase()).filter(Boolean) || [];
    const isAdmin = userRoles.some(r => r && (r.includes('admin') || r.includes('manager') || r.includes('lead'))) ||
        (hasPermission && (hasPermission('manage_leads') || hasPermission('admin')));

    useEffect(() => {
        fetchAgents();
    }, []);

    useEffect(() => {
        setPage(1); // Reset to first page when fetching new data
        fetchData();
    }, [agentFilter, dateRange]);

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
            const todayStr = new Date().toISOString().split('T')[0];
            // If the filter is for Tomorrow, we want to look at scheduled callbacks, not past activities
            const isFuture = dateRange.start > todayStr;

            const params = {
                agent_id: isAdmin ? agentFilter : currentUser.id,
                startDate: dateRange.start,
                endDate: dateRange.end,
                trackActivity: !isFuture
            };
            const res = await SalesService.getFollowUps(params);
            setInteractions(res.data || []);
        } catch (err) {
            toast.error('Failed to fetch interaction history');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (interactions.length === 0) return toast.error('No data to export');

        // Prepare CSV data
        const headers = ['S.No', 'Activity Date', 'Lead Status', 'Type', 'Name', 'Company', 'Notes', 'BDM'];
        const rows = filteredInteractions.map((it, index) => [
            index + 1,
            new Date(it.created_at).toLocaleDateString(),
            it.lead?.status || 'Active',
            it.type,
            it.lead?.name || 'N/A',
            it.lead?.company || 'N/A',
            `"${(it.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
            it.agent?.full_name || 'N/A'
        ]);

        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `BDM_Activity_${dateRange.start}_to_${dateRange.end}.csv`);
        link.click();
        URL.revokeObjectURL(url);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Call': return <Phone size={16} />;
            case 'Callback': return <Phone size={16} />;
            case 'Email': return <Mail size={16} />;
            case 'Meeting': return <Users size={16} />;
            case 'Note': return <FileText size={16} />;
            default: return <FileText size={16} />;
        }
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedInteractions = [...interactions].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested lead values
        if (sortConfig.key === 'lead_name') {
            aValue = a.lead?.name || '';
            bValue = b.lead?.name || '';
        }
        if (sortConfig.key === 'lead_company') {
            aValue = a.lead?.company || '';
            bValue = b.lead?.company || '';
        }
        if (sortConfig.key === 'agent_name') {
            aValue = a.agent?.full_name || '';
            bValue = b.agent?.full_name || '';
        }
        if (sortConfig.key === 'status') {
            aValue = a.lead?.status || '';
            bValue = b.lead?.status || '';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredInteractions = sortedInteractions.filter(it => {
        const matchesSearch = it.lead?.name?.toLowerCase().includes(search.toLowerCase()) ||
            it.lead?.company?.toLowerCase().includes(search.toLowerCase()) ||
            it.notes?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = !leadStatusFilter || it.lead?.status === leadStatusFilter;

        return matchesSearch && matchesStatus;
    });

    // Grouping logic for collapsible view
    const groupedInteractions = filteredInteractions.reduce((acc, it) => {
        const lid = it.lead_id || 'unassigned';
        if (!acc[lid]) {
            acc[lid] = {
                lead: it.lead,
                items: [],
                lastActive: it.created_at
            };
        }
        acc[lid].items.push(it);
        if (new Date(it.created_at) > new Date(acc[lid].lastActive)) {
            acc[lid].lastActive = it.created_at;
        }
        return acc;
    }, {});

    const sortedGroups = Object.values(groupedInteractions).sort((a, b) =>
        new Date(b.lastActive) - new Date(a.lastActive)
    );

    const toggleExpand = (lid) => {
        const next = new Set(expandedLeads);
        if (next.has(lid)) next.delete(lid);
        else next.add(lid);
        setExpandedLeads(next);
    };

    // Pagination Logic
    const totalPages = Math.ceil(sortedGroups.length / limit);
    const paginatedGroups = sortedGroups.slice((page - 1) * limit, page * limit);

    // Summary Metrics
    const stats = {
        total: filteredInteractions.length,
        won: new Set(interactions.filter(it => it.lead?.status === 'Won').map(it => it.lead_id).filter(Boolean)).size,
        proposal: new Set(interactions.filter(it => it.lead?.status === 'Proposal').map(it => it.lead_id).filter(Boolean)).size,
        leadCount: new Set(interactions.map(it => it.lead_id).filter(Boolean)).size
    };

    return (
        <div className="interaction-history-page">
            <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1>Interaction & Activity History</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Complete log of BDM notes and engagements recorded in this period.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <DateRangePicker
                        startDate={dateRange.start}
                        endDate={dateRange.end}
                        onRangeChange={(range) => setDateRange({ start: range.startDate, end: range.endDate })}
                    />
                    <button className="btn btn-secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={18} /> Export Activity CSV
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="card polished-card" style={{ padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 2, minWidth: '250px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} size={16} />
                        <input
                            type="text"
                            placeholder="Search by client, company or notes..."
                            className="form-control"
                            style={{ paddingLeft: '36px', height: '40px' }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {isAdmin && (
                        <div className="filter-group">
                            <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Performer (BDM)</label>
                            <select
                                className="form-control"
                                style={{ height: '40px', width: '160px' }}
                                value={agentFilter}
                                onChange={e => {
                                    setAgentFilter(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">All BDMs</option>
                                {allAgents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="filter-group">
                        <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Lead Status</label>
                        <select
                            className="form-control"
                            style={{ height: '40px', width: '160px' }}
                            value={leadStatusFilter}
                            onChange={e => {
                                setLeadStatusFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">All Status</option>
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Proposal">Proposal Sent</option>
                            <option value="Won">Won</option>
                            <option value="Lost">Lost</option>
                        </select>
                    </div>

                </div>
            </div>

            {/* Scorecard Bar */}
            <div className="stats-grid" style={{ marginBottom: '32px' }}>
                <div
                    className={`card polished-card stat-card-enhanced ${!leadStatusFilter ? 'active-filter' : ''}`}
                    style={{ borderLeft: '4px solid var(--accent)', cursor: 'pointer' }}
                    onClick={() => { setLeadStatusFilter(''); setPage(1); }}
                >
                    <div className="stat-icon-box" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent)' }}>
                        <LayoutGrid size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Total Activities</label>
                        <h3>{stats.total}</h3>
                        <div className="stat-footer">Global View</div>
                    </div>
                </div>

                <div
                    className={`card polished-card stat-card-enhanced ${leadStatusFilter === 'Won' ? 'active-filter' : ''}`}
                    style={{ borderLeft: '4px solid #22c55e', cursor: 'pointer' }}
                    onClick={() => { setLeadStatusFilter('Won'); setPage(1); }}
                >
                    <div className="stat-icon-box" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Deals Won</label>
                        <h3>{stats.won}</h3>
                        <div className="stat-footer">Conversion Success</div>
                    </div>
                </div>

                <div
                    className={`card polished-card stat-card-enhanced ${leadStatusFilter === 'Proposal' ? 'active-filter' : ''}`}
                    style={{ borderLeft: '4px solid #fbbf24', cursor: 'pointer' }}
                    onClick={() => { setLeadStatusFilter('Proposal'); setPage(1); }}
                >
                    <div className="stat-icon-box" style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>
                        <FileText size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Proposals</label>
                        <h3>{stats.proposal}</h3>
                        <div className="stat-footer">Awaiting Response</div>
                    </div>
                </div>

                <div className="card polished-card stat-card-enhanced" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <div className="stat-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Lead Reach</label>
                        <h3>{stats.leadCount}</h3>
                        <div className="stat-footer">Unique Contacts</div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="card polished-card" style={{ padding: '80px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
            ) : (
                <div className="card polished-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}>S.No</th>
                                    <th style={{ width: '140px', cursor: 'pointer' }} onClick={() => requestSort('created_at')}>
                                        Logged Date {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th style={{ width: '220px', cursor: 'pointer' }} onClick={() => requestSort('lead_name')}>
                                        Name {sortConfig.key === 'lead_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th style={{ width: '130px', cursor: 'pointer' }} onClick={() => requestSort('type')}>
                                        Action {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => requestSort('notes')}>
                                        Interaction Details {sortConfig.key === 'notes' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th style={{ width: '100px', cursor: 'pointer' }} onClick={() => requestSort('status')}>
                                        Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    {isAdmin && <th style={{ width: '160px', cursor: 'pointer' }} onClick={() => requestSort('agent_name')}>
                                        BDM {sortConfig.key === 'agent_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>}
                                    <th style={{ width: '100px' }}>Actions</th>
                                </tr>
                            </thead>
                            {paginatedGroups.length > 0 ? paginatedGroups.map((group, groupIdx) => {
                                const lid = group.lead?.id || `group-${groupIdx}`;
                                const isExpanded = expandedLeads.has(lid);
                                const hasMultiple = group.items.length > 1;
                                const globalIndex = (page - 1) * limit + groupIdx + 1;

                                return (
                                    <tbody key={lid} style={{ borderBottom: '1px solid var(--border)' }}>
                                        {/* Master Client Row */}
                                        <tr
                                            className={`clickable-row ${hasMultiple ? 'group-master-row' : ''}`}
                                            onClick={() => hasMultiple && toggleExpand(lid)}
                                            style={{ background: isExpanded ? 'rgba(124, 58, 237, 0.04)' : 'transparent' }}
                                        >
                                            <td><span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>#{globalIndex}</span></td>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: '13px' }}>
                                                    {new Date(group.lastActive).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                                    {new Date(group.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {hasMultiple && (
                                                        <div style={{
                                                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                                            transition: '0.2s transform ease',
                                                            color: 'var(--accent)',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}>
                                                            <ChevronRight size={16} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <div style={{ fontWeight: 800, color: 'var(--accent-light)', fontSize: '15px' }}>
                                                            {group.lead?.name || 'Unknown Lead'}
                                                        </div>
                                                        {hasMultiple && !isExpanded && (
                                                            <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                {group.items.length} Activities Collapsed
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {!isExpanded ? (
                                                // Show summary info when collapsed
                                                <>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
                                                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {getIcon(group.items[0].type)}
                                                            </div>
                                                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{group.items[0].type}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="text-truncate" style={{ maxWidth: '350px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                                            <ExpandableNote text={group.items[0].notes} />
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px',
                                                            background: group.lead?.status === 'Won' ? 'rgba(34,197,94,0.15)' :
                                                                group.lead?.status === 'Lost' ? 'rgba(239,68,68,0.15)' :
                                                                    group.lead?.status === 'Proposal' ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.06)',
                                                            color: group.lead?.status === 'Won' ? '#22c55e' :
                                                                group.lead?.status === 'Lost' ? '#ef4444' :
                                                                    group.lead?.status === 'Proposal' ? '#a78bfa' : '#e4e4e7',
                                                            border: `1px solid ${group.lead?.status === 'Won' ? 'rgba(34,197,94,0.2)' :
                                                                group.lead?.status === 'Lost' ? 'rgba(239,68,68,0.2)' :
                                                                    group.lead?.status === 'Proposal' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.1)'
                                                                }`
                                                        }}>
                                                            {group.lead?.status || 'Active'}
                                                        </span>
                                                    </td>
                                                    {isAdmin && (
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <div className="avatar-xs-circle">
                                                                    {group.items[0].agent?.full_name?.charAt(0)}
                                                                </div>
                                                                <span style={{ fontSize: '13px' }}>{group.items[0].agent?.full_name}</span>
                                                            </div>
                                                        </td>
                                                    )}
                                                </>
                                            ) : (
                                                <td colSpan={isAdmin ? 4 : 3} style={{ background: 'rgba(124, 58, 237, 0.02)', textAlign: 'center' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>
                                                        Activity History for {group.lead?.name}
                                                    </span>
                                                </td>
                                            )}
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    className="btn btn-sm btn-icon-view"
                                                    onClick={() => setSelectedLeadId(group.lead?.id)}
                                                    title="View Lead Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Sub-items for expanded view */}
                                        {isExpanded && group.items.map((it, itIdx) => (
                                            <tr key={it.id} style={{ background: 'rgba(255,255,255,0.01)' }}>
                                                <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                                                    <span style={{ fontSize: '10px', opacity: 0.4, fontWeight: 800 }}>{globalIndex}.{itIdx + 1}</span>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '12px', opacity: 0.9 }}>
                                                        {new Date(it.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        <div style={{ fontSize: '10px', opacity: 0.5 }}>
                                                            {new Date(it.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '16px' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', opacity: 0.6 }}>
                                                        Log #{group.items.length - itIdx}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9 }}>
                                                        {getIcon(it.type)}
                                                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{it.type}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ maxWidth: '350px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                                                        <ExpandableNote text={it.notes} />
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px',
                                                        background: group.lead?.status === 'Won' ? 'rgba(34,197,94,0.1)' :
                                                            group.lead?.status === 'Lost' ? 'rgba(239,68,68,0.1)' :
                                                                group.lead?.status === 'Proposal' ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.04)',
                                                        color: group.lead?.status === 'Won' ? '#22c55e' :
                                                            group.lead?.status === 'Lost' ? '#ef4444' :
                                                                group.lead?.status === 'Proposal' ? '#a78bfa' : '#a1a1aa',
                                                    }}>
                                                        {group.lead?.status || 'Active'}
                                                    </span>
                                                </td>
                                                {isAdmin && (
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8 }}>
                                                            <div className="avatar-xs-circle" style={{ width: '20px', height: '20px', fontSize: '9px' }}>
                                                                {it.agent?.full_name?.charAt(0)}
                                                            </div>
                                                            <span style={{ fontSize: '12px' }}>{it.agent?.full_name}</span>
                                                        </div>
                                                    </td>
                                                )}
                                                <td></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                );
                            }) : (
                                <tbody>
                                    <tr>
                                        <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '120px 0' }}>
                                            <Clock size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.1 }} />
                                            <div style={{ color: 'var(--text-dim)', fontWeight: 500 }}>No interaction logs discovered for this period.</div>
                                        </td>
                                    </tr>
                                </tbody>
                            )}
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, sortedGroups.length)} of {sortedGroups.length} groups
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    style={{ padding: '6px' }}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                                    {page} / {totalPages}
                                </div>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    style={{ padding: '6px' }}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedLeadId && (
                <LeadDetailsModal
                    leadId={selectedLeadId}
                    onClose={() => setSelectedLeadId(null)}
                    onSaved={fetchData}
                />
            )}

            <style>{`
                .interaction-history-page { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                .clickable-row { transition: background 0.2s; }
                .clickable-row:hover { background: rgba(124, 58, 237, 0.04) !important; }
                .filter-group { display: flex; flex-direction: column; }
                .users-table th { background: rgba(255,255,255,0.02); height: 50px; }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                }
                .stat-card-enhanced {
                    padding: 20px;
                    display: flex;
                    gap: 16px;
                    align-items: center;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid var(--border);
                    backdrop-filter: blur(8px);
                    border-radius: 12px;
                }
                .stat-card-enhanced:hover, .stat-card-enhanced.active-filter {
                    transform: translateY(-3px);
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(124, 58, 237, 0.6);
                    box-shadow: 0 10px 25px -12px rgba(0,0,0,0.7);
                }
                .stat-icon-box {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 4px 12px -2px rgba(0,0,0,0.3);
                }
                .stat-content label {
                    display: block;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: var(--text);
                    margin-bottom: 2px;
                    letter-spacing: 1px;
                    opacity: 0.5;
                }
                .stat-content h3 {
                    font-size: 26px;
                    font-weight: 900;
                    margin-bottom: 0px;
                    line-height: 1.1;
                    color: var(--text);
                    letter-spacing: -0.5px;
                }
                .stat-footer {
                    font-size: 10px;
                    font-weight: 800;
                    color: var(--accent);
                    opacity: 0.9;
                    letter-spacing: 0.2px;
                    margin-top: 2px;
                    text-transform: uppercase;
                }

                .group-master-row {
                    cursor: pointer;
                }
                .avatar-xs-circle {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: var(--accent);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: 800;
                }
                .btn-icon-view {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: rgba(124, 58, 237, 0.1);
                    color: var(--accent);
                    border: 1px solid rgba(124, 58, 237, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .btn-icon-view:hover {
                    background: var(--accent);
                    color: white;
                }
            `}</style>
        </div>
    );
}
