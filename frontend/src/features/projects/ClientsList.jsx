import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit2, Trash2, Building, Mail, Phone, ChevronUp, ChevronDown, CheckCircle, TrendingUp, X } from 'lucide-react';
import { ClientsService } from './ClientsService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import LeadJourneyView from '../sales/LeadJourneyView';
import DataTable from '../../components/common/DataTable';

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

            <div className="card polished-card" style={{ padding: 0 }}>
                {loading ? (
                    <div className="page-loader" style={{ minHeight: '300px' }}><div className="spinner" /></div>
                ) : (
                    <DataTable
                        data={clients}
                        fileName="clients-list"
                        loading={loading}
                        columns={[
                            {
                                label: 'Company',
                                key: 'company_name',
                                render: (val, client) => (
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Building size={14} color="var(--accent)" />
                                            {val}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                                            Created: {new Date(client.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                )
                            },
                            {
                                label: 'Acquisition Date',
                                key: 'id',
                                render: (_, client) => {
                                    const primaryProject = client.projects?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                                    return primaryProject?.acquisition_date ? (
                                        <span style={{ fontSize: 13, fontWeight: 500 }}>
                                            {new Date(primaryProject.acquisition_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    ) : <span style={{ opacity: 0.3 }}>--</span>;
                                }
                            },
                            {
                                label: 'Value (Rs)',
                                key: 'deal_value',
                                render: (val, client) => {
                                    const primaryProject = client.projects?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                                    const finalVal = val || primaryProject?.deal_value;
                                    return finalVal ? (
                                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)' }}>₹{finalVal.toLocaleString()}</span>
                                    ) : <span style={{ opacity: 0.3 }}>--</span>;
                                }
                            },
                            {
                                label: 'Contact',
                                key: 'contact_name',
                                render: (val, client) => (
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: 13 }}>{val || '--'}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-dim)', display: 'flex', gap: 6, marginTop: 2 }}>
                                            {client.phone && <span>{client.phone}</span>}
                                        </div>
                                    </div>
                                )
                            },
                            {
                                label: 'Project Service Types',
                                key: 'id',
                                render: (_, client) => {
                                    const primaryProject = client.projects?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                                    return (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                            {primaryProject?.sub_types?.map((type, i) => (
                                                <span key={i} style={{ fontSize: 9, background: 'rgba(108, 92, 231, 0.1)', color: 'var(--accent-light)', padding: '1px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>
                                                    {type}
                                                </span>
                                            )) || <span style={{ opacity: 0.3, fontSize: 12 }}>--</span>}
                                        </div>
                                    );
                                }
                            },
                            {
                                label: 'Description',
                                key: 'id',
                                render: (_, client) => {
                                    const primaryProject = client.projects?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                                    return (
                                        <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', lineHeight: 1.4, maxWidth: 250 }}>
                                            {primaryProject?.description ? <ExpandableClientDesc text={primaryProject.description} /> : <span style={{ opacity: 0.3 }}>No description provided.</span>}
                                        </div>
                                    );
                                }
                            },
                            {
                                label: 'Status',
                                key: 'status',
                                render: (val) => <span className={`status-badge ${val.toLowerCase()}`}>{val}</span>
                            },
                            {
                                label: 'BDM / Owner',
                                key: 'owner.full_name',
                                render: (val) => <span style={{ fontSize: 13, fontWeight: 500 }}>{val || 'System'}</span>
                            },
                            {
                                label: 'Actions',
                                key: 'id',
                                render: (_, client) => (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                        {client.lead_id && (
                                            <button className="btn-icon" style={{ padding: 6 }} title="View Full Journey" onClick={() => setViewJourneyLeadId(client.lead_id)}>
                                                <TrendingUp size={15} color="var(--accent)" />
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button className="btn-icon" style={{ padding: 6 }} title="Delete" onClick={() => handleDelete(client.id)}>
                                                <Trash2 size={15} color="var(--danger)" />
                                            </button>
                                        )}
                                    </div>
                                )
                            }
                        ]}
                    />
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

function ExpandableClientDesc({ text, limit = 80 }) {
    const [expanded, setExpanded] = useState(false);
    if (!text) return null;
    if (text.length <= limit) return <span>{text}</span>;

    return (
        <span>
            {expanded ? text : `${text.slice(0, limit)}... `}
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                style={{
                    background: 'none', border: 'none', color: 'var(--accent-light)',
                    cursor: 'pointer', fontSize: '10px', fontWeight: 800,
                    padding: '0 4px', textTransform: 'uppercase'
                }}
            >
                {expanded ? 'Less' : 'More'}
            </button>
        </span>
    );
}
