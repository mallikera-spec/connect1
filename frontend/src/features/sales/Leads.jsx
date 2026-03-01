import { Plus, Search, Calendar, Filter, ChevronDown, ChevronUp, Briefcase, Eye, Edit2, Trash2, X, AlertCircle, UploadCloud, ChevronLeft, ChevronRight } from 'lucide-react';
import { SalesService } from './SalesService';
import { useAuth } from '../../context/AuthContext';
import LeadDetailsModal from './LeadDetailsModal';
import NewLeadModal from './NewLeadModal';
import EditLeadModal from './EditLeadModal';
import BulkUploadModal from './BulkUploadModal';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import LeadLifecycleBoard from './LeadLifecycleBoard';

/**
 * Leads — Central hub for sales lead tracking and management.
 */
export default function Leads() {
    const { user: currentUser, hasPermission } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('board'); // 'list' or 'board'

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [totalLeads, setTotalLeads] = useState(0);

    // Filters State - initialized from URL search params OR location state (from Dashboard)
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

    // Role Checks
    const userRoles = currentUser?.roles?.map(r => typeof r === 'string' ? r.toLowerCase() : r.name?.toLowerCase()).filter(Boolean) || [];
    const isAdmin = userRoles.some(r => r && (r.includes('admin') || r.includes('manager') || r.includes('lead'))) ||
        (hasPermission && (hasPermission('manage_leads') || hasPermission('admin')));

    // Modals State
    const [selectedLeadId, setSelectedLeadId] = useState(null);
    const [editingLeadId, setEditingLeadId] = useState(null);
    const [selectedLeadIds, setSelectedLeadIds] = useState([]);
    const [bulkAgentId, setBulkAgentId] = useState('');
    const [bulkStatus, setBulkStatus] = useState('');
    const [isBulkAssigning, setIsBulkAssigning] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
    const [allAgents, setAllAgents] = useState([]);

    useEffect(() => {
        if (location.state) {
            if (location.state.status !== undefined) setStatusFilter(location.state.status || '');
            if (location.state.agent !== undefined) setAssignedAgentId(location.state.agent || '');
            if (location.state.startDate || location.state.endDate) {
                setDateRange({
                    start: location.state.startDate || dateRange.start,
                    end: location.state.endDate || dateRange.end
                });
            }
            if (location.state.leadId) {
                setSelectedLeadId(location.state.leadId);
            }
            setPage(1);
        }
    }, [location.state]);

    useEffect(() => {
        setPage(1); // Reset to page 1 when filters change natively
    }, [statusFilter, sourceFilter, assigned_agent_id, dateRange, sortBy, sortOrder]);

    useEffect(() => {
        fetchData();
        fetchAgents();
    }, [page, limit, statusFilter, sourceFilter, assigned_agent_id, dateRange, sortBy, sortOrder]);

    const fetchAgents = async () => {
        try {
            const res = await api.get('/users', { params: { role: 'BDM,Admin,Super Admin' } });
            setAllAgents(res.data.data);
        } catch (err) { console.error(err); }
    };

    const setDatePreset = (preset) => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        switch (preset) {
            case 'today': break;
            case 'yesterday':
                start.setDate(now.getDate() - 1);
                end.setDate(now.getDate() - 1);
                break;
            case 'this_week':
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                start.setDate(diff);
                break;
            case 'this_month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last_month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            default: return;
        }

        const formatDate = (d) => d.toISOString().split('T')[0];
        setDateRange({ start: formatDate(start), end: formatDate(end) });
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

    const handleSearchEnter = (e) => {
        if (e.key === 'Enter') {
            setPage(1);
            fetchData();
        }
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const handleBulkAssign = async () => {
        if (!bulkAgentId || selectedLeadIds.length === 0) return;
        setIsBulkAssigning(true);
        try {
            const agentId = bulkAgentId === 'unassigned' ? null : bulkAgentId;
            await SalesService.bulkAssignLeads(selectedLeadIds, agentId);
            toast.success('Bulk assignment successful');
            setSelectedLeadIds([]);
            setBulkAgentId('');
            fetchData();
        } catch (err) {
            toast.error(err.message || 'Failed to assign leads');
        } finally {
            setIsBulkAssigning(false);
        }
    };

    const handleBulkStatusUpdate = async () => {
        if (!bulkStatus || selectedLeadIds.length === 0) return;
        setIsBulkAssigning(true);
        try {
            await SalesService.bulkUpdateLeadsStatus(selectedLeadIds, bulkStatus);
            toast.success('Bulk status update successful');
            setSelectedLeadIds([]);
            setBulkStatus('');
            fetchData();
        } catch (err) {
            toast.error(err.message || 'Failed to update status');
        } finally {
            setIsBulkAssigning(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedLeadIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedLeadIds.length} leads?`)) return;

        setIsBulkAssigning(true);
        try {
            await SalesService.bulkDeleteLeads(selectedLeadIds);
            toast.success('Leads deleted successfully');
            setSelectedLeadIds([]);
            fetchData();
        } catch (err) {
            toast.error(err.message || 'Failed to delete leads');
        } finally {
            setIsBulkAssigning(false);
        }
    };

    const toggleLeadSelection = (id) => {
        setSelectedLeadIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedLeadIds.length === leads.length) {
            setSelectedLeadIds([]);
        } else {
            setSelectedLeadIds(leads.map(l => l.id));
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

    return (
        <div className="leads-container">
            <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1>Leads Lifecycle</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Track prospects from cold discovery to active clients.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {/* View Toggle */}
                    <div className="view-toggle">
                        <button
                            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            List View
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'board' ? 'active' : ''}`}
                            onClick={() => setViewMode('board')}
                        >
                            Board View
                        </button>
                    </div>

                    {isAdmin && (
                        <button className="btn btn-secondary" onClick={() => setIsBulkUploadModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UploadCloud size={18} /> Bulk Upload
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> New Lead
                    </button>
                </div>
            </div>

            {/* Unified Action & Filter Bar */}
            <div className="card polished-card" style={{ padding: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} size={16} />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            className="form-control"
                            style={{ paddingLeft: '36px', height: '40px' }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearchEnter}
                        />
                    </div>

                    {isAdmin && (
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-app)', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', height: '40px' }}>
                            <Briefcase size={14} color="var(--text-dim)" style={{ marginRight: '8px' }} />
                            <select
                                className="form-select-minimal"
                                style={{ width: '130px', border: 'none', background: 'transparent' }}
                                value={assigned_agent_id}
                                onChange={(e) => setAssignedAgentId(e.target.value)}
                            >
                                <option value="">All Agents</option>
                                {allAgents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                            </select>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-app)', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', height: '40px' }}>
                        <Filter size={14} color="var(--text-dim)" style={{ marginRight: '8px' }} />
                        <select
                            className="form-select-minimal"
                            style={{ width: '120px', border: 'none', background: 'transparent' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="New">New Lead</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Proposal">Proposal</option>
                            <option value="Won">Won</option>
                            <option value="Lost">Lost</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', gap: '8px', height: '40px' }}>
                        <Calendar size={14} color="var(--text-dim)" />
                        <select
                            className="form-select-minimal"
                            style={{ width: '80px', border: 'none', background: 'transparent' }}
                            onChange={(e) => setDatePreset(e.target.value)}
                            value=""
                        >
                            <option value="" disabled>Range</option>
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="this_week">This Week</option>
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                        </select>
                        <input type="date" className="filter-input-minimal" style={{ width: '110px' }} value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} />
                        <span style={{ color: 'var(--text-dim)' }}>-</span>
                        <input type="date" className="filter-input-minimal" style={{ width: '110px' }} value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} />
                    </div>

                    <button className="btn btn-secondary" onClick={() => { setPage(1); fetchData(); }} style={{ height: '40px' }}>Apply</button>
                </div>
            </div>

            {/* Leads Views */}
            {loading ? (
                <div className="card polished-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="page-loader" style={{ minHeight: '300px' }}><div className="spinner" /></div>
                </div>
            ) : viewMode === 'board' ? (
                <LeadLifecycleBoard leads={leads} onSelectLead={setSelectedLeadId} />
            ) : (
                <div className="card polished-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="users-table">
                            <thead>
                                <tr>
                                    {isAdmin && (
                                        <th style={{ width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                checked={leads.length > 0 && selectedLeadIds.length === leads.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                    )}
                                    <th style={{ width: '120px', cursor: 'pointer' }} onClick={() => handleSort('created_at')}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            Date {sortBy === 'created_at' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                        </div>
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            Name / Company {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                        </div>
                                    </th>
                                    <th style={{ width: '130px' }}>Phone</th>
                                    <th style={{ width: '120px' }}>Status</th>
                                    <th style={{ width: '110px', cursor: 'pointer' }} onClick={() => handleSort('deal_value')}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            Value {sortBy === 'deal_value' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                        </div>
                                    </th>
                                    <th>Assigned BDM</th>
                                    <th style={{ textAlign: 'right', paddingRight: '24px', width: '110px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.length > 0 ? leads.map(lead => (
                                    <tr key={lead.id} className={`clickable-row ${selectedLeadIds.includes(lead.id) ? 'row-selected' : ''}`} onClick={() => setSelectedLeadId(lead.id)}>
                                        {isAdmin && (
                                            <td style={{ width: '40px' }} onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLeadIds.includes(lead.id)}
                                                    onChange={() => toggleLeadSelection(lead.id)}
                                                />
                                            </td>
                                        )}
                                        <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                                            {new Date(lead.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {lead.follow_ups?.some(f => f.status === 'Pending') && (
                                                    <div title="Pending Callback/Follow-up" style={{ color: 'var(--warning)', marginTop: '2px' }}>
                                                        <AlertCircle size={14} />
                                                    </div>
                                                )}
                                                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{lead.name}</div>
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{lead.company || lead.email}</div>
                                        </td>
                                        <td style={{ fontSize: '13px' }}>{lead.phone || '--'}</td>
                                        <td>
                                            <span className={`status-badge ${lead.status?.toLowerCase().replace(' ', '-')}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                                                Rs {parseFloat(lead.deal_value || 0).toLocaleString()}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '13px' }}>
                                            {lead.assigned_agent?.full_name || <span style={{ opacity: 0.5 }}>Unassigned</span>}
                                        </td>
                                        <td style={{ textAlign: 'right', paddingRight: '24px' }} onClick={(e) => e.stopPropagation()}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button className="btn-icon" title="View" onClick={() => setSelectedLeadId(lead.id)}>
                                                    <Eye size={16} color="var(--accent-light)" />
                                                </button>
                                                <button className="btn-icon" title="Edit" onClick={(e) => { e.stopPropagation(); setEditingLeadId(lead.id); }}>
                                                    <Edit2 size={16} color="var(--info)" />
                                                </button>
                                                <button className="btn-icon" title="Delete" onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }}>
                                                    <Trash2 size={16} color="var(--danger)" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
                                            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔎</div>
                                            <div>No leads found.</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Pagination Footer */}
                        {totalLeads > 0 && viewMode === 'list' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalLeads)} of {totalLeads} leads
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <select
                                        className="form-select-minimal"
                                        style={{ width: '85px', marginRight: '16px' }}
                                        value={limit}
                                        onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                    >
                                        <option value="10">10 / page</option>
                                        <option value="50">50 / page</option>
                                        <option value="100">100 / page</option>
                                        <option value="500">500 / page</option>
                                    </select>

                                    <button
                                        className="btn-icon"
                                        style={{ border: '1px solid var(--border)', background: 'var(--bg-app)' }}
                                        disabled={page === 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '30px', textAlign: 'center' }}>
                                        {page}
                                    </span>
                                    <button
                                        className="btn-icon"
                                        style={{ border: '1px solid var(--border)', background: 'var(--bg-app)' }}
                                        disabled={page * limit >= totalLeads}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Bulk Action Bar */}
            {selectedLeadIds.length > 0 && isAdmin && viewMode === 'list' && (
                <div className="card polished-card bulk-action-bar">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div className="stat-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent)' }}>
                                <Briefcase size={20} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '14px' }}>{selectedLeadIds.length} Leaders Selected</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Bulk management.</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <select className="form-select-minimal" style={{ width: '150px', height: '32px' }} value={bulkAgentId} onChange={(e) => setBulkAgentId(e.target.value)}>
                                    <option value="">Assign BDM..</option>
                                    <option value="unassigned">Unassigned</option>
                                    {allAgents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                                </select>
                                <button className="btn btn-primary btn-sm" style={{ height: '32px' }} disabled={!bulkAgentId || isBulkAssigning} onClick={handleBulkAssign}>Assign</button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <select className="form-select-minimal" style={{ width: '130px', height: '32px' }} value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
                                    <option value="">Set Status...</option>
                                    <option value="New">New</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Proposal">Proposal</option>
                                    <option value="Won">Won</option>
                                    <option value="Lost">Lost</option>
                                </select>
                                <button className="btn btn-secondary btn-sm" style={{ height: '32px' }} disabled={!bulkStatus || isBulkAssigning} onClick={handleBulkStatusUpdate}>Update</button>
                            </div>

                            <button className="btn-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '38px', height: '38px' }} onClick={handleBulkDelete}><Trash2 size={18} /></button>
                            <button className="btn-icon" style={{ background: 'var(--bg-app)', width: '32px', height: '32px' }} onClick={() => setSelectedLeadIds([])}><X size={16} /></button>
                        </div>
                    </div>
                </div>
            )}

            <BulkUploadModal
                isOpen={isBulkUploadModalOpen}
                onClose={() => setIsBulkUploadModalOpen(false)}
                onSuccess={fetchData}
                agents={allAgents}
                currentUser={currentUser}
            />
            {isAddModalOpen && <NewLeadModal onClose={() => setIsAddModalOpen(false)} onSaved={fetchData} />}
            {editingLeadId && <EditLeadModal leadId={editingLeadId} onClose={() => setEditingLeadId(null)} onSaved={fetchData} />}
            {selectedLeadId && <LeadDetailsModal leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} onSaved={fetchData} />}

            <style>{`
                .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
                .status-badge.new { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
                .status-badge.contacted { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.2); }
                .status-badge.qualified { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
                .status-badge.proposal { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
                .status-badge.won { background: rgba(16, 185, 129, 0.2); color: #059669; border: 1px solid #10b981; }
                .status-badge.lost { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
                .clickable-row:hover { background: var(--bg-app) !important; cursor: pointer; }
                .row-selected { background: rgba(124, 58, 237, 0.08) !important; border-left: 3px solid var(--accent); }
                .bulk-action-bar { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 1000; background: var(--bg-card); border: 1px solid var(--accent); box-shadow: 0 12px 40px rgba(0,0,0,0.3); padding: 12px 20px; animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
                @keyframes slideUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
                .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
                .form-select-minimal { background: var(--bg-app); border: 1px solid var(--border); border-radius: 6px; font-size: 12px; padding: 4px 8px; color: var(--text); outline: none; }
                .view-toggle { display: flex; background: var(--bg-app); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
                .toggle-btn { padding: 8px 16px; font-size: 13px; font-weight: 600; border: none; background: transparent; color: var(--text-dim); cursor: pointer; transition: all 0.2s; }
                .toggle-btn:hover { color: var(--text); background: rgba(255,255,255,0.05); }
                .toggle-btn.active { background: var(--accent); color: white; }
            `}</style>
        </div>
    );
}
