import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Pencil, Trash2, X, Users, UserPlus, UserMinus, Info, Download, FileText, CheckCircle, Clock } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import DataTable from '../../components/common/DataTable'
import ProjectDetailsModal from './ProjectDetailsModal'
import { formatDate, formatCurrency } from '../../utils/formatters'

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
    const [form, setForm] = useState({
        name: '',
        description: '',
        status: 'active',
        client_name: '',
        client_email: '',
        client_phone: '',
        sub_types: [],
        acquisition_date: '',
        days_committed: 0,
        due_date: ''
    })

    const SUB_TYPES = [
        'Website', 'Android app', 'IOS app', 'Digital Marketing', 'Automations', 'Maintenance', 'AI/ML'
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
            acquisition_date: '',
            days_committed: 0,
            due_date: ''
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
            acquisition_date: p.acquisition_date || '',
            days_committed: p.days_committed || 0,
            due_date: p.due_date || ''
        });
        setModal('edit')
    }
    const openDetails = (p) => navigate(`/projects/${p.id}`)
    const openDelete = (p) => { setSelected(p); setModal('delete') }
    const closeModal = () => { setModal(null); setSelected(null) }

    const handleCreate = async (e) => {
        e.preventDefault(); setSaving(true)
        try { 
            if (/^\d+$/.test(form.name)) throw new Error('Project name cannot be purely numeric');
            if (form.client_name && /^\d+$/.test(form.client_name)) throw new Error('Client name cannot be purely numeric');
            await api.post('/projects', form); toast.success('Project created'); load(); closeModal() 
        }
        catch (err) { toast.error(err.response?.data?.message || err.message) }
        finally { setSaving(false) }
    }

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!selected) return;
        setSaving(true)
        try { 
            if (/^\d+$/.test(form.name)) throw new Error('Project name cannot be purely numeric');
            if (form.client_name && /^\d+$/.test(form.client_name)) throw new Error('Client name cannot be purely numeric');
            await api.patch(`/projects/${selected.id}`, form); toast.success('Project updated'); load(); closeModal() 
        }
        catch (err) { toast.error(err.response?.data?.message || err.message) }
        finally { setSaving(false) }
    }

    const handleDelete = async () => {
        if (!selected) return;
        setSaving(true)
        try { await api.delete(`/projects/${selected.id}`); toast.success('Project deleted'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const f = (k) => (e) => {
        const val = e.target.value;
        setForm(p => {
            const next = { ...p, [k]: val };
            if (k === 'acquisition_date' || k === 'days_committed') {
                const acq = k === 'acquisition_date' ? val : p.acquisition_date;
                const days = k === 'days_committed' ? val : p.days_committed;
                if (acq && days !== undefined && days !== '') {
                    try {
                        const date = new Date(acq);
                        if (!isNaN(date.getTime())) {
                            date.setDate(date.getDate() + parseInt(days));
                            next.due_date = date.toISOString().split('T')[0];
                        }
                    } catch (err) { console.warn('Date calculation failed:', err); }
                }
            }
            return next;
        });
    }

    const handleSubtypeChange = (type) => {
        setForm(p => {
            const sub_types = p.sub_types || [];
            return { ...p, sub_types: sub_types.includes(type) ? sub_types.filter(t => t !== type) : [...sub_types, type] };
        });
    }

    const columns = useMemo(() => [
        { label: 'Date', key: 'acquisition_date', type: 'date', width: '120px', render: (val) => formatDate(val) },
        { label: 'Name', key: 'name', width: '250px', copyable: true, render: (val) => <strong>{val}</strong> },
        { label: 'Sub-types', key: 'sub_types', width: '180px', render: (val) => val?.join(', ') || '—' },
        ...(canManage ? [
            { label: 'Client', key: 'client_name', width: '150px' },
            { label: 'Phone', key: 'client_phone', width: '130px' }
        ] : []),
        {
            label: 'Status',
            key: 'status',
            type: 'status',
            width: '120px',
            render: (val) => {
                const s = PROJECT_STATUS[val] || PROJECT_STATUS.active;
                return (
                    <span className="badge" style={{ background: s.color + '15', color: s.color, fontWeight: 700, padding: '4px 10px', borderRadius: '12px', fontSize: '11px', textTransform: 'uppercase' }}>
                        {s.label}
                    </span>
                );
            }
        },
        {
            label: 'Due Date',
            key: 'due_date',
            type: 'date',
            width: '140px',
            render: (val) => {
                if (!val) return '—';
                const today = new Date(); today.setHours(0,0,0,0);
                const due = new Date(val);
                const diff = (due - today) / (1000 * 60 * 60 * 24);
                let color = 'inherit';
                if (diff < 0) color = 'var(--danger)';
                else if (diff <= 7) color = 'var(--warning)';
                return <span style={{ color, fontWeight: diff <= 7 ? 700 : 400 }}>{formatDate(val)}</span>;
            }
        },
        {
            label: 'Actions',
            key: 'actions',
            width: '140px',
            render: (_, p) => (
                <div className="actions-cell">
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); openDetails(p); }} title="View Details"><Info size={14} /></button>
                    {canManage && <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); openEdit(p); }} title="Edit"><Pencil size={14} /></button>}
                    {hasPermission('delete_project') && <button className="btn btn-danger btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); openDelete(p); }} title="Delete"><Trash2 size={14} /></button>}
                </div>
            )
        }
    ], [canManage, hasPermission]);

    const bulkActions = [
        { 
            label: 'Complete Selected', 
            icon: <CheckCircle size={14} />, 
            handler: async (rows) => {
                if(window.confirm(`Mark ${rows.length} projects as completed?`)) {
                    toast.promise(Promise.all(rows.map(r => api.patch(`/projects/${r.id}`, { status: 'completed' }))), {
                        loading: 'Updating projects...',
                        success: 'Projects updated!',
                        error: 'Failed to update projects'
                    }).then(() => load());
                }
            }
        }
    ];

    return (
        <div className="page-layout">
            <div className="page-header print-hide">
                <div className="header-titles">
                    <h1>Projects</h1>
                    <p>Standardized overview of all ongoing and planned projects</p>
                </div>
                <div className="header-actions">
                    <select
                        className="form-select filter-select"
                        value={filters.status}
                        onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); load({ status: e.target.value }); }}
                    >
                        <option value="">All Statuses</option>
                        {Object.entries(PROJECT_STATUS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
                    </select>
                    {canManage && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />New Project</button>}
                </div>
            </div>

            <div className="card table-card">
                <DataTable
                    data={projects}
                    columns={columns}
                    loading={loading}
                    fileName="projects_report"
                    selectable={true}
                    bulkActions={bulkActions}
                    onRowClick={(p) => openDetails(p)}
                    onAdd={openCreate}
                    canAdd={canManage}
                />
            </div>

            {modal === 'create' && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal">
                        <div className="modal-header"><h2 className="modal-title">New Project</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <form id="create-project-form" onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-group"><label className="form-label">Project Name</label><input className="form-input" value={form.name} onChange={f('name')} required /></div>
                                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows={5} value={form.description} onChange={f('description')} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Client Name</label><input className="form-input" value={form.client_name || ''} onChange={f('client_name')} /></div>
                                    <div className="form-group"><label className="form-label">Status</label>
                                        <select className="form-select" value={form.status} onChange={f('status')}>
                                            {Object.entries(PROJECT_STATUS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Client Phone</label><input className="form-input" value={form.client_phone || ''} onChange={f('client_phone')} /></div>
                                    <div className="form-group"><label className="form-label">Client Email</label><input type="email" className="form-input" value={form.client_email || ''} onChange={f('client_email')} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Acquisition Date</label><input type="date" className="form-input" value={form.acquisition_date} onChange={f('acquisition_date')} /></div>
                                    <div className="form-group"><label className="form-label">Committed Days</label><input type="number" className="form-input" value={form.days_committed} onChange={f('days_committed')} /></div>
                                </div>
                                <div className="form-group"><label className="form-label">Due Date</label><input type="date" className="form-input" value={form.due_date} onChange={f('due_date')} disabled /></div>
                                <div className="form-group">
                                    <label className="form-label">Project Sub-types</label>
                                    <div className="subtype-grid">
                                        {SUB_TYPES.map(type => (
                                            <label key={type} className="checkbox-label">
                                                <input type="checkbox" checked={form.sub_types?.includes(type)} onChange={() => handleSubtypeChange(type)} />
                                                {type}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </form>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                            <button type="submit" form="create-project-form" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create Project'}</button>
                        </div>
                    </div>
                </div>
            )}

            {modal === 'edit' && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal">
                        <div className="modal-header"><h2 className="modal-title">Edit Project</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <form id="edit-project-form" onSubmit={handleEdit}>
                            <div className="modal-body">
                                <div className="form-group"><label className="form-label">Project Name</label><input className="form-input" value={form.name} onChange={f('name')} required /></div>
                                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows={5} value={form.description} onChange={f('description')} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Client Name</label><input className="form-input" value={form.client_name || ''} onChange={f('client_name')} /></div>
                                    <div className="form-group"><label className="form-label">Status</label>
                                        <select className="form-select" value={form.status} onChange={f('status')}>
                                            {Object.entries(PROJECT_STATUS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Client Phone</label><input className="form-input" value={form.client_phone || ''} onChange={f('client_phone')} /></div>
                                    <div className="form-group"><label className="form-label">Client Email</label><input type="email" className="form-input" value={form.client_email || ''} onChange={f('client_email')} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Acquisition Date</label><input type="date" className="form-input" value={form.acquisition_date} onChange={f('acquisition_date')} /></div>
                                    <div className="form-group"><label className="form-label">Committed Days</label><input type="number" className="form-input" value={form.days_committed} onChange={f('days_committed')} /></div>
                                </div>
                                <div className="form-group"><label className="form-label">Due Date</label><input type="date" className="form-input" value={form.due_date} onChange={f('due_date')} disabled /></div>
                                <div className="form-group">
                                    <label className="form-label">Project Sub-types</label>
                                    <div className="subtype-grid">
                                        {SUB_TYPES.map(type => (
                                            <label key={type} className="checkbox-label">
                                                <input type="checkbox" checked={form.sub_types?.includes(type)} onChange={() => handleSubtypeChange(type)} />
                                                {type}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </form>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                            <button type="submit" form="edit-project-form" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </div>
                </div>
            )}

            {modal === 'details' && selected && <ProjectDetailsModal project={selected} allUsers={allUsers} onClose={closeModal} onSaved={load} />}

            {modal === 'delete' && selected && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal" style={{ height: 'auto', minHeight: 'unset' }}>
                        <div className="modal-header"><h2 className="modal-title">Delete Project</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <div className="modal-body"><p>Are you sure you want to delete <strong>{selected.name}</strong>? This action cannot be undone.</p></div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting...' : 'Delete Project'}</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .page-layout { padding: 8px; }
                .header-actions { display: flex; gap: 12px; align-items: center; }
                .filter-select { height: 38px; min-width: 150px; }
                .subtype-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; }
                .checkbox-label { display: flex; alignItems: center; gap: 8px; font-size: 13px; cursor: pointer; }
                .badge { display: inline-block; }
            `}</style>
        </div>
    )
}
