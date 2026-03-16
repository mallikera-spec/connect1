import { Plus, Search, Calendar, Filter, Briefcase, Eye, Edit2, Trash2, X, AlertCircle, UploadCloud, MessageSquare, CheckCircle, UserPlus } from 'lucide-react';
import { SalesService } from './SalesService';
import { useAuth } from '../../context/AuthContext';
import LeadDetailsModal from './LeadDetailsModal';
import NewLeadModal from './NewLeadModal';
import EditLeadModal from './EditLeadModal';
import BulkUploadModal from './BulkUploadModal';
import LogFollowUpModal from './LogFollowUpModal';
import BulkAssignModal from './BulkAssignModal';
import BulkStatusModal from './BulkStatusModal';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import LeadLifecycleBoard from './LeadLifecycleBoard';
import DataTable from '../../components/common/DataTable';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import { formatDate, formatCurrency, toLocalISOString } from '../../utils/formatters';

const ExpandableNote = ({ note }) => {
    const [expanded, setExpanded] = useState(false);
    if (!note) return <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>--</span>;
    const isLong = note.length > 50;
    const displayText = expanded ? note : note.slice(0, 50) + (isLong ? '...' : '');

    return (
        <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: '1.4' }}>
            {displayText}
            {isLong && (
                <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '11px', fontWeight: 600, padding: 0, marginLeft: '4px', cursor: 'pointer' }}
                >
                    {expanded ? 'Show Less' : 'Read More'}
                </button>
            )}
        </div>
    );
};

export default function Leads() {
    const { user: currentUser, hasPermission } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('board');

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [totalLeads, setTotalLeads] = useState(0);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(location.state?.status || searchParams.get('status') || '');
    const [sourceFilter, setSourceFilter] = useState('');
    const [assigned_agent_id, setAssignedAgentId] = useState(location.state?.agent || searchParams.get('agent') || '');
    const [dateRange, setDateRange] = useState({
        start: location.state?.startDate || searchParams.get('startDate') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: location.state?.endDate || searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    });
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');

    const userRoles = currentUser?.roles?.map(r => typeof r === 'string' ? r.toLowerCase() : r.name?.toLowerCase()).filter(Boolean) || [];
    const isAdmin = userRoles.some(r => r && (r.includes('admin') || r.includes('manager') || r.includes('lead') || r.includes('director'))) ||
        (hasPermission && (hasPermission('manage_leads') || hasPermission('admin')));

    const [selectedLeadId, setSelectedLeadId] = useState(null);
    const [editingLeadId, setEditingLeadId] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [activeLogLeadId, setActiveLogLeadId] = useState(null);
    const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
    const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
    const [selectedBulkLeadIds, setSelectedBulkLeadIds] = useState([]);
    const [allAgents, setAllAgents] = useState([]);

    useEffect(() => { fetchData(); fetchAgents(); }, [page, limit, statusFilter, sourceFilter, assigned_agent_id, dateRange, sortBy, sortOrder, search]);

    const fetchAgents = async () => {
        try {
            // Include Director in the list of assignable agents
            const res = await api.get('/users', { params: { role: 'BDM,Admin,Super Admin,Director' } });
            setAllAgents(res.data.data);
        } catch (err) { console.error(err); }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                search,
                status: statusFilter,
                source: sourceFilter,
                assigned_agent_id,
                startDate: dateRange.start,
                endDate: dateRange.end,
                sortBy,
                sortOrder,
                page,
                limit
            };
            const leadsRes = await SalesService.getLeads(params);
            setLeads(leadsRes.data || []);
            setTotalLeads(leadsRes.pagination?.total || 0);
        } catch (err) {
            console.error('Failed to fetch sales data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLead = async (id) => {
        if (!window.confirm('Are you sure you want to delete this lead?')) return;
        try {
            await SalesService.deleteLead(id);
            toast.success('Lead deleted successfully');
            fetchData();
        } catch (err) {
            toast.error(err.message || 'Failed to delete lead');
        }
    };

    const columns = useMemo(() => [
        { label: 'Date', key: 'created_at', type: 'date', width: '120px', sortable: true, render: (val) => formatDate(val) },
        {
            label: 'Lead',
            key: 'name',
            width: '250px',
            sortable: true,
            copyable: true,
            render: (name, lead) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {lead.follow_ups?.some(f => f.status === 'Pending') && <AlertCircle size={14} color="var(--warning)" title="Pending Follow-up" />}
                        <strong>{name}</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{lead.company || lead.email}</div>
                </div>
            )
        },
        { label: 'Phone', key: 'phone', width: '140px', copyable: true },
        { label: 'Location', key: 'location', width: '150px' },
        {
            label: 'Status',
            key: 'status',
            type: 'status',
            width: '140px',
            sortable: true,
            render: (val) => <span className={`status-badge ${val?.toLowerCase().replace(' ', '-')}`}>{val}</span>
        },
        {
            label: 'Last Note',
            key: 'latest_note',
            width: '250px',
            render: (_, lead) => {
                if (!lead.follow_ups?.length) return <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>No interactions</span>;
                const latest = [...lead.follow_ups].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                return <ExpandableNote note={latest.notes} />;
            }
        },
        { label: 'Value', key: 'deal_value', type: 'currency', width: '140px', sortable: true, render: (val) => formatCurrency(val) },
        ...(isAdmin ? [{ label: 'Assignee', key: 'assigned_agent.full_name', width: '160px', render: (val) => val || 'Unassigned' }] : []),
        {
            label: 'Actions',
            key: 'actions',
            width: '160px',
            render: (_, lead) => (
                <div className="actions-cell">
                    <button className="btn btn-ghost btn-sm btn-icon" title="Log Interaction" onClick={(e) => { e.stopPropagation(); setActiveLogLeadId(lead.id); setIsLogModalOpen(true); }}><MessageSquare size={16} color="var(--warning)" /></button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedLeadId(lead.id); }}><Eye size={16} /></button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); setEditingLeadId(lead.id); }}><Edit2 size={16} /></button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }}><Trash2 size={16} /></button>
                </div>
            )
        }
    ], [isAdmin]);

    const bulkActions = useMemo(() => [
        {
            label: 'Assign Agent',
            icon: <UserPlus size={14} />,
            handler: (rows) => {
                setSelectedBulkLeadIds(rows.map(r => r.id));
                setIsBulkAssignModalOpen(true);
            }
        },
        {
            label: 'Update Status',
            icon: <CheckCircle size={14} />,
            handler: (rows) => {
                setSelectedBulkLeadIds(rows.map(r => r.id));
                setIsBulkStatusModalOpen(true);
            }
        },
        {
            label: 'Delete',
            icon: <Trash2 size={14} />,
            handler: async (rows) => {
                if (window.confirm(`Delete ${rows.length} leads?`)) {
                    try {
                        await SalesService.bulkDeleteLeads(rows.map(r => r.id));
                        toast.success('Leads deleted');
                        fetchData();
                    } catch (err) { toast.error(err.message); }
                }
            }
        }
    ], []);


    return (
        <div className="leads-container">
            <div className="page-header">
                <div>
                    <h1>Leads Lifecycle</h1>
                    <p>Track prospects from discovery to conversion</p>
                </div>
                <div className="header-actions">
                    <div className="view-toggle">
                        <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>List</button>
                        <button className={`toggle-btn ${viewMode === 'board' ? 'active' : ''}`} onClick={() => setViewMode('board')}>Board</button>
                    </div>
                    {isAdmin && <button className="btn btn-secondary" onClick={() => setIsBulkUploadModalOpen(true)}><UploadCloud size={18} /> Bulk Upload</button>}
                    <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}><Plus size={18} /> New Lead</button>
                </div>
            </div>

            <div className="card polished-card filter-bar">
                <div className="filter-row">
                    {isAdmin && (
                        <select className="form-select filter-select" value={assigned_agent_id} onChange={e => setAssignedAgentId(e.target.value)}>
                            <option value="">All Agents</option>
                            {allAgents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                        </select>
                    )}
                    <select className="form-select filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All Statuses</option>
                        {['New', 'Contacted', 'Meeting', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Invalid', 'Not Connected'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <DateRangeFilter
                        value={dateRange}
                        onChange={setDateRange}
                        onApply={fetchData}
                    />
                </div>
            </div>

            {viewMode === 'board' ? (
                <LeadLifecycleBoard leads={leads} onSelectLead={setSelectedLeadId} />
            ) : (
                <div className="card table-card">
                    <DataTable
                        data={leads}
                        columns={columns}
                        loading={loading}
                        searchTerm={search}
                        onSearchChange={setSearch}
                        fileName="leads_export"
                        totalItems={totalLeads}
                        currentPage={page}
                        itemsPerPage={limit}
                        selectable={isAdmin}
                        bulkActions={isAdmin ? bulkActions : []}
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                        onSortChange={(s) => { setSortBy(s.key); setSortOrder(s.direction); }}
                        sortConfig={{ key: sortBy, direction: sortOrder }}
                        onRowClick={(lead) => setSelectedLeadId(lead.id)}
                        onAdd={() => setIsAddModalOpen(true)}
                        canAdd={isAdmin}
                    />
                </div>
            )}

            <BulkUploadModal isOpen={isBulkUploadModalOpen} onClose={() => setIsBulkUploadModalOpen(false)} onSuccess={fetchData} agents={allAgents} currentUser={currentUser} />
            {isAddModalOpen && <NewLeadModal onClose={() => setIsAddModalOpen(false)} onSaved={fetchData} />}
            {editingLeadId && <EditLeadModal leadId={editingLeadId} onClose={() => setEditingLeadId(null)} onSaved={fetchData} />}
            {selectedLeadId && <LeadDetailsModal leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} onSaved={fetchData} />}
            <LogFollowUpModal isOpen={isLogModalOpen} onClose={() => { setIsLogModalOpen(false); setActiveLogLeadId(null); }} leadId={activeLogLeadId} onSuccess={fetchData} />
            
            <BulkAssignModal 
                isOpen={isBulkAssignModalOpen} 
                onClose={() => setIsBulkAssignModalOpen(false)} 
                onSuccess={fetchData} 
                leadIds={selectedBulkLeadIds} 
                agents={allAgents} 
            />
            <BulkStatusModal 
                isOpen={isBulkStatusModalOpen} 
                onClose={() => setIsBulkStatusModalOpen(false)} 
                onSuccess={fetchData} 
                leadIds={selectedBulkLeadIds} 
            />

            <style>{`
                .leads-container { padding: 8px; }
                .header-actions { display: flex; gap: 12px; align-items: center; }
                .filter-bar { margin-bottom: 20px; padding: 10px 16px; background: white; border: 1px solid var(--border); }
                .filter-row { display: flex; gap: 8px; align-items: center; justify-content: space-between; flex-wrap: nowrap; overflow-x: auto; }
                .search-wrap { position: relative; flex: 2; min-width: 180px; display: flex; align-items: center; }
                .search-wrap svg { position: absolute; left: 10px; color: var(--text-dim); }
                .search-wrap input { width: 100%; padding: 7px 10px 7px 32px; background: var(--bg-app); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-size: 13px; }
                .filter-select { flex: 1; min-width: 120px; padding: 7px; font-size: 13px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-app); }
                .date-filter.compact { display: flex; align-items: center; gap: 4px; background: var(--bg-app); padding: 4px 8px; border: 1px solid var(--border); border-radius: 6px; flex-shrink: 0; }
                .date-filter.compact input { background: transparent; border: none; font-size: 12px; color: var(--text); padding: 4px; width: 105px; }
                .date-filter.compact span { color: var(--text-dim); }
                .status-badge { padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; border: 1px solid transparent; }
                .status-badge.new { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border-color: rgba(59, 130, 246, 0.2); }
                .status-badge.won { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: #10b981; }
                .status-badge.lost { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.2); }
                .view-toggle { display: flex; background: var(--bg-app); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
                .toggle-btn { padding: 6px 16px; font-size: 13px; font-weight: 600; border: none; background: transparent; color: var(--text-dim); cursor: pointer; }
                .toggle-btn.active { background: var(--accent); color: white; }
                .actions-cell { display: flex; gap: 4px; justify-content: center; }
            `}</style>
        </div>
    );
}
