import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Pencil, Trash2, X, Users, UserPlus, UserMinus, Info, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import ProjectDetailsModal from './ProjectDetailsModal'



export default function ProjectsPage() {
    const { user, hasPermission, hasRole } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [projects, setProjects] = useState([])
    const [allUsers, setAllUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null)
    const [selected, setSelected] = useState(null)
    const [filters, setFilters] = useState({ status: '' })
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [form, setForm] = useState({
        name: '',
        description: '',
        status: 'active',
        client_name: '',
        client_email: '',
        client_phone: '',
        sub_types: [],
        acquisition_date: ''
    })

    const SUB_TYPES = [
        'Website', 'Android app', 'IOS app', 'Digital Marketing', 'Automations'
    ]

    const PROJECT_STATUS = {
        active: { label: 'Active', color: '#10b981' },
        on_hold: { label: 'On Hold', color: '#f59e0b' },
        completed: { label: 'Completed', color: '#0891b2' },
        cancelled: { label: 'Cancelled', color: '#dc2626' },
        planning: { label: 'Planning', color: '#7c3aed' },
    }

    const canManage = hasPermission('manage_projects') || hasRole('super_admin') || hasRole('project_manager') || hasRole('hr')

    const load = async (params = {}) => {
        setLoading(true)
        try {
            const finalParams = { ...params }
            if (!canManage) finalParams.memberUserId = user?.id

            const pRes = await api.get('/projects', { params: finalParams })
            setProjects(pRes.data.data || [])

            try {
                const uRes = await api.get('/users')
                setAllUsers(uRes.data.data)
            } catch (uErr) {
                console.warn('Could not fetch users, likely due to permissions:', uErr.message)
                setAllUsers([])
            }
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (location.state) {
            const params = {}
            if (location.state.startDate) params.startDate = location.state.startDate
            if (location.state.endDate) params.endDate = location.state.endDate
            if (location.state.status) {
                params.status = location.state.status
                setFilters({ status: location.state.status })
            }

            load(params)

            if (location.state.openCreateModal) {
                openCreate()
            }
            window.history.replaceState({}, document.title)
        } else {
            load()
        }
    }, [location.state])

    const openCreate = () => {
        setForm({
            name: '',
            description: '',
            status: 'active',
            client_name: '',
            client_email: '',
            client_phone: '',
            sub_types: [],
            acquisition_date: ''
        });
        setModal('create')
    }
    const openEdit = (p) => {
        setSelected(p);
        setForm({
            name: p.name,
            description: p.description || '',
            status: p.status || 'active',
            client_name: p.client_name || '',
            client_email: p.client_email || '',
            client_phone: p.client_phone || '',
            sub_types: p.sub_types || [],
            acquisition_date: p.acquisition_date || ''
        });
        setModal('edit')
    }
    const openDetails = (p) => navigate(`/projects/${p.id}`)
    const openDelete = (p) => { setSelected(p); setModal('delete') }
    const closeModal = () => { setModal(null); setSelected(null) }

    const handleCreate = async (e) => {
        e.preventDefault(); setSaving(true)
        try { await api.post('/projects', form); toast.success('Project created'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleEdit = async (e) => {
        e.preventDefault(); setSaving(true)
        try { await api.patch(`/projects/${selected.id}`, form); toast.success('Project updated'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleDelete = async () => {
        setSaving(true)
        try { await api.delete(`/projects/${selected.id}`); toast.success('Project deleted'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
    const handleSubtypeChange = (type) => {
        setForm(p => {
            const sub_types = p.sub_types || [];
            if (sub_types.includes(type)) {
                return { ...p, sub_types: sub_types.filter(t => t !== type) };
            } else {
                return { ...p, sub_types: [...sub_types, type] };
            }
        });
    }
    const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—'

    // --- SORT & PAGINATION LOGIC ---
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

    return (
        <div>
            <div className="page-header">
                <div><h1>Projects</h1><p>Manage all projects and their team members</p></div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
                    {canManage && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />New Project</button>}
                </div>
            </div>

            <div className="table-wrapper">
                {loading ? <div className="page-loader"><div className="spinner" /></div> : (
                    <table>
                        <thead><tr>
                            <th style={{ width: 50 }}>S.No</th>
                            <th onClick={() => handleSort('acquisition_date')} style={{ cursor: 'pointer' }}>Acquisition Date <SortIcon column="acquisition_date" /></th>
                            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name <SortIcon column="name" /></th>
                            <th>Sub-type</th>
                            <th>Description</th>
                            <th>Client Name</th>
                            <th>Client Phone</th>
                            <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status <SortIcon column="status" /></th>
                            <th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {(!projects || projects.length === 0) && <tr><td colSpan={9}><div className="empty-state"><p>No projects yet</p></div></td></tr>}
                            {paginatedProjects.map((p, idx) => (
                                <tr key={p.id}>
                                    <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                    <td>
                                        <div style={{ fontSize: 13, fontWeight: 700 }}>{formatDate(p.acquisition_date)}</div>
                                    </td>
                                    <td><strong>{p.name}</strong></td>
                                    <td style={{ fontSize: 13 }}>{p.sub_types?.join(', ') || '—'}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 200 }}>{p.description || '—'}</td>
                                    <td style={{ fontSize: 13 }}>{p.client_name || '—'}</td>
                                    <td style={{ fontSize: 13 }}>{p.client_phone || '—'}</td>
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
                                            {canManage && <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(p)} title="Edit Project"><Pencil size={14} /></button>}
                                            {hasPermission('delete_project') && <button className="btn btn-danger btn-sm btn-icon" onClick={() => openDelete(p)} title="Delete Project"><Trash2 size={14} /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination Controls */}
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
                            <option value={100}>100</option>
                        </select>
                        entries
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button
                            className="btn btn-ghost btn-sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                            <ChevronLeft size={16} /> Prev
                        </button>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            Page <strong>{currentPage}</strong> of <strong>{totalPages || 1}</strong>
                        </span>
                        <button
                            className="btn btn-ghost btn-sm"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(p => p + 1)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>

                    <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                        Showing <strong>{Math.min((currentPage - 1) * itemsPerPage + 1, sortedProjects.length)}</strong> to <strong>{Math.min(currentPage * itemsPerPage, sortedProjects.length)}</strong> of <strong>{sortedProjects.length}</strong> entries
                    </div>
                </div>
            )}

            {modal === 'create' && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal">
                        <div className="modal-header"><h2 className="modal-title">New Project</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-group"><label className="form-label">Project Name</label><input className="form-input" value={form.name} onChange={f('name')} required /></div>
                                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows={2} value={form.description} onChange={f('description')} style={{ resize: 'vertical' }} /></div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group"><label className="form-label">Client Name</label><input className="form-input" value={form.client_name} onChange={f('client_name')} /></div>
                                    <div className="form-group"><label className="form-label">Client Phone</label><input className="form-input" value={form.client_phone} onChange={f('client_phone')} /></div>
                                </div>
                                <div className="form-group"><label className="form-label">Client Email</label><input type="email" className="form-input" value={form.client_email} onChange={f('client_email')} /></div>
                                <div className="form-group"><label className="form-label">Project Acquisition Date</label><input type="date" className="form-input" value={form.acquisition_date} onChange={f('acquisition_date')} /></div>

                                <div className="form-group">
                                    <label className="form-label">Project Sub-types</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', background: 'var(--surface-light)', padding: 12, borderRadius: 8 }}>
                                        {SUB_TYPES.map(type => (
                                            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                                                <input type="checkbox" checked={form.sub_types?.includes(type)} onChange={() => handleSubtypeChange(type)} />
                                                {type}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={form.status} onChange={f('status')}>
                                        <option value="planning">Planning</option>
                                        <option value="active">Active</option>
                                        <option value="on_hold">On Hold</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modal === 'edit' && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal">
                        <div className="modal-header"><h2 className="modal-title">Edit Project</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <form onSubmit={handleEdit}>
                            <div className="modal-body">
                                <div className="form-group"><label className="form-label">Project Name</label><input className="form-input" value={form.name} onChange={f('name')} required /></div>
                                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows={2} value={form.description} onChange={f('description')} style={{ resize: 'vertical' }} /></div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group"><label className="form-label">Client Name</label><input className="form-input" value={form.client_name} onChange={f('client_name')} /></div>
                                    <div className="form-group"><label className="form-label">Client Phone</label><input className="form-input" value={form.client_phone} onChange={f('client_phone')} /></div>
                                </div>
                                <div className="form-group"><label className="form-label">Client Email</label><input type="email" className="form-input" value={form.client_email} onChange={f('client_email')} /></div>
                                <div className="form-group"><label className="form-label">Project Acquisition Date</label><input type="date" className="form-input" value={form.acquisition_date} onChange={f('acquisition_date')} /></div>

                                <div className="form-group">
                                    <label className="form-label">Project Sub-types</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', background: 'var(--surface-light)', padding: 12, borderRadius: 8 }}>
                                        {SUB_TYPES.map(type => (
                                            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                                                <input type="checkbox" checked={form.sub_types?.includes(type)} onChange={() => handleSubtypeChange(type)} />
                                                {type}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={form.status} onChange={f('status')}>
                                        <option value="planning">Planning</option>
                                        <option value="active">Active</option>
                                        <option value="on_hold">On Hold</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modal === 'details' && selected && (
                <ProjectDetailsModal project={selected} allUsers={allUsers} onClose={closeModal} onSaved={load} />
            )}

            {modal === 'delete' && selected && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal" style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h2 className="modal-title">Delete Project</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <div className="modal-body"><p style={{ fontSize: 14 }}>Delete project <strong>{selected.name}</strong>? All associated tasks will also be removed.</p></div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
