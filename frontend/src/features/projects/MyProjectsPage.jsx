import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Info, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, FileText, Download } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import ProjectDetailsModal from './ProjectDetailsModal'

export default function MyProjectsPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [projects, setProjects] = useState([])
    const [allUsers, setAllUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(null)
    const [selected, setSelected] = useState(null)
    const [filters, setFilters] = useState({ status: '' })
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const PROJECT_STATUS = {
        active: { label: 'Active', color: '#10b981' },
        on_hold: { label: 'On Hold', color: '#f59e0b' },
        completed: { label: 'Completed', color: '#0891b2' },
        cancelled: { label: 'Cancelled', color: '#dc2626' },
        planning: { label: 'Planning', color: '#7c3aed' },
    }

    const load = async (params = {}) => {
        setLoading(true)
        try {
            const finalParams = { ...params, memberUserId: user?.id }
            const pRes = await api.get('/projects', { params: finalParams })
            setProjects(pRes.data.data || [])

            try {
                const uRes = await api.get('/users')
                setAllUsers(uRes.data.data)
            } catch (uErr) {
                console.warn('Could not fetch users:', uErr.message)
                setAllUsers([])
            }
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    const openDetails = (p) => navigate(`/projects/${p.id}`)
    const closeModal = () => { setModal(null); setSelected(null) }

    const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—'

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedProjects = [...projects].sort((a, b) => {
        if (!sortConfig.key) return 0;
        let valA = a[sortConfig.key] || '';
        let valB = b[sortConfig.key] || '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
    const paginatedProjects = sortedProjects.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <ChevronUp size={12} style={{ opacity: 0.3, marginLeft: 4 }} />;
        return sortConfig.direction === 'asc'
            ? <ChevronUp size={12} style={{ marginLeft: 4, color: 'var(--accent)' }} />
            : <ChevronDown size={12} style={{ marginLeft: 4, color: 'var(--accent)' }} />;
    };

    const handleExportCSV = () => {
        if (!projects || projects.length === 0) {
            toast.error('No projects to export');
            return;
        }

        const headers = ['Project Name', 'Client Name', 'Status', 'Due Date', 'Sub-Types', 'Description'];
        const csvContent = [
            headers.join(','),
            ...projects.map(p => {
                const s = PROJECT_STATUS[p.status] ? PROJECT_STATUS[p.status].label : p.status;
                const d = p.due_date ? new Date(p.due_date).toLocaleDateString() : '—';
                const subs = p.sub_types ? p.sub_types.join('; ') : '';
                return `"${p.name || ''}","${p.client_name || ''}","${s}","${d}","${subs}","${(p.description || '').replace(/"/g, '""')}"`;
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `my_projects_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleExportPDF = () => {
        window.print();
    };

    return (
        <div>
            <div className="page-header print-hide">
                <div><h1>My Projects</h1><p>View and manage your assigned projects</p></div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button className="btn btn-outline btn-sm" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Download size={14} /> CSV
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FileText size={14} /> PDF
                    </button>
                    <div style={{ minWidth: 150 }}>
                        <select
                            className="form-select"
                            style={{ margin: 0, height: 38, fontSize: 13 }}
                            value={filters.status}
                            onChange={(e) => {
                                const s = e.target.value;
                                setFilters(prev => ({ ...prev, status: s }));
                                load({ status: s });
                            }}
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="on_hold">On Hold</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="planning">Planning</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-wrapper">
                {loading ? <div className="page-loader"><div className="spinner" /></div> : (
                    <table>
                        <thead><tr>
                            <th style={{ width: 50 }}>S.No</th>
                            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Project Name <SortIcon column="name" /></th>
                            <th>Sub-type</th>
                            <th>Description</th>
                            <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status <SortIcon column="status" /></th>
                            <th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {(!projects || projects.length === 0) && <tr><td colSpan={6}><div className="empty-state"><p>No projects assigned yet</p></div></td></tr>}
                            {paginatedProjects.map((p, idx) => (
                                <tr key={p.id}>
                                    <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                    <td><strong>{p.name}</strong></td>
                                    <td style={{ fontSize: 13 }}>{p.sub_types?.join(', ') || '—'}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 300 }}>{p.description || '—'}</td>
                                    <td>
                                        {(() => {
                                            const s = PROJECT_STATUS[p.status] || PROJECT_STATUS.active
                                            return (
                                                <span style={{ background: s.color + '22', color: s.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                                                    {s.label}
                                                </span>
                                            )
                                        })()}
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openDetails(p)} title="View Details, Files & Notes"><Info size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {projects.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, padding: '0 20px', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                        Show
                        <select
                            className="form-select"
                            style={{ margin: 0, padding: '2px 8px', height: 32, width: 70, fontSize: 13 }}
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        entries
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button className="btn btn-ghost btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ChevronLeft size={16} /> Prev
                        </button>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            Page <strong>{currentPage}</strong> of <strong>{totalPages || 1}</strong>
                        </span>
                        <button className="btn btn-ghost btn-sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            Next <ChevronRight size={16} />
                        </button>
                    </div>

                    <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                        Showing <strong>{Math.min((currentPage - 1) * itemsPerPage + 1, sortedProjects.length)}</strong> to <strong>{Math.min(currentPage * itemsPerPage, sortedProjects.length)}</strong> of <strong>{sortedProjects.length}</strong> entries
                    </div>
                </div>
            )}

            {modal === 'details' && selected && (
                <ProjectDetailsModal project={selected} allUsers={allUsers} onClose={closeModal} onSaved={load} />
            )}
        </div>
    )
}
