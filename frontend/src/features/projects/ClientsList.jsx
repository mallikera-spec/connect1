import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit2, Trash2, Building, Mail, Phone, ChevronUp, ChevronDown, CheckCircle, TrendingUp, X } from 'lucide-react';
import { ClientsService } from './ClientsService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import LeadJourneyView from '../sales/LeadJourneyView';

export default function ClientsList() {
    const { user: currentUser } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewJourneyLeadId, setViewJourneyLeadId] = useState(null);

    const userRoles = currentUser?.roles?.map(r => r.toLowerCase()) || [];
    const isAdmin = userRoles.some(r => r.includes('admin') || r.includes('manager'));

    useEffect(() => {
        fetchClients();
    }, [statusFilter, sortBy, sortOrder]);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await ClientsService.getClients({ search, status: statusFilter });

            // Client-side sorting (or rely on backend if advanced)
            let sorted = [...res.data.data];
            sorted.sort((a, b) => {
                let valA = a[sortBy];
                let valB = b[sortBy];
                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();

                if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });

            setClients(sorted);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchEnter = (e) => {
        if (e.key === 'Enter') fetchClients();
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this client?')) return;
        try {
            await ClientsService.deleteClient(id);
            toast.success('Client deleted successfully');
            fetchClients();
        } catch (err) {
            toast.error('Failed to delete client');
        }
    };

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1>Clients</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Manage active clients converted from won leads.</p>
                </div>
            </div>

            <div className="card polished-card" style={{ padding: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} size={16} />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            className="form-control"
                            style={{ paddingLeft: '36px', height: '40px' }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearchEnter}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-app)', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', height: '40px' }}>
                        <Filter size={14} color="var(--text-dim)" style={{ marginRight: '8px' }} />
                        <select
                            className="form-select-minimal"
                            style={{ width: '120px', border: 'none', background: 'transparent' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Archived">Archived</option>
                        </select>
                    </div>

                    <button className="btn btn-secondary" onClick={fetchClients} style={{ height: '40px' }}>Apply</button>
                </div>
            </div>

            <div className="card polished-card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div className="page-loader" style={{ minHeight: '300px' }}><div className="spinner" /></div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('company_name')}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            Company {sortBy === 'company_name' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                        </div>
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('contact_name')}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            Contact {sortBy === 'contact_name' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                        </div>
                                    </th>
                                    <th>Status</th>
                                    <th>BDM / Owner</th>
                                    <th style={{ width: '120px', cursor: 'pointer' }} onClick={() => handleSort('created_at')}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            Created {sortBy === 'created_at' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                        </div>
                                    </th>
                                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.length > 0 ? clients.map(client => (
                                    <tr key={client.id}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Building size={14} color="var(--accent)" />
                                                {client.company_name}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{client.contact_name || '--'}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                                                {client.email && <span><Mail size={10} style={{ marginRight: '2px' }} />{client.email}</span>}
                                                {client.phone && <span><Phone size={10} style={{ marginRight: '2px' }} />{client.phone}</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${client.status.toLowerCase()}`}>
                                                {client.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '13px' }}>
                                                {client.owner?.full_name || 'System'}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                                            {new Date(client.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                {client.lead_id && (
                                                    <button className="btn-icon" title="View Full Journey" onClick={() => setViewJourneyLeadId(client.lead_id)}>
                                                        <TrendingUp size={16} color="var(--accent)" />
                                                    </button>
                                                )}
                                                {isAdmin && (
                                                    <button className="btn-icon" title="Delete" onClick={() => handleDelete(client.id)}>
                                                        <Trash2 size={16} color="var(--danger)" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
                                            <div style={{ fontSize: '32px', marginBottom: '16px', color: 'var(--success)' }}><CheckCircle size={32} /></div>
                                            <div>No clients found. Win some deals to populate this module!</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {viewJourneyLeadId && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewJourneyLeadId(null)}>
                    <div className="modal modal-lg" style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <h2 className="modal-title" style={{ fontSize: '20px' }}>Full Client Journey</h2>
                            <button className="btn-icon" onClick={() => setViewJourneyLeadId(null)}><X size={18} /></button>
                        </div>
                        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                            <LeadJourneyView leadId={viewJourneyLeadId} />
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
                .status-badge.active { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
                .status-badge.inactive { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
                .status-badge.archived { background: rgba(156, 163, 175, 0.1); color: #9ca3af; border: 1px solid rgba(156, 163, 175, 0.2); }
                .form-select-minimal { background: var(--bg-app); border: 1px solid var(--border); border-radius: 6px; font-size: 12px; padding: 4px 8px; color: var(--text); outline: none; }
            `}</style>
        </div>
    );
}
