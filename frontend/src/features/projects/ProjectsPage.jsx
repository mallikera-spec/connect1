import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Pencil, Trash2, X, Users, UserPlus, UserMinus, Info } from 'lucide-react'
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
    const [form, setForm] = useState({ name: '', description: '', status: 'active' })

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
            if (location.state.status) params.status = location.state.status

            load(params)

            if (location.state.openCreateModal) {
                openCreate()
            }
            window.history.replaceState({}, document.title)
        } else {
            load()
        }
    }, [location.state])

    const openCreate = () => { setForm({ name: '', description: '', status: 'active' }); setModal('create') }
    const openEdit = (p) => { setSelected(p); setForm({ name: p.name, description: p.description || '', status: p.status || 'active' }); setModal('edit') }
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
    const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—'

    return (
        <div>
            <div className="page-header">
                <div><h1>Projects</h1><p>Manage all projects and their team members</p></div>
                {canManage && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />New Project</button>}
            </div>

            <div className="table-wrapper">
                {loading ? <div className="page-loader"><div className="spinner" /></div> : (
                    <table>
                        <thead><tr>
                            <th>Name</th><th>Description</th><th>Status</th><th>Members</th><th>Created By</th><th>Created</th><th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {(!projects || projects.length === 0) && <tr><td colSpan={7}><div className="empty-state"><p>No projects yet</p></div></td></tr>}
                            {(projects || []).map(p => (
                                <tr key={p.id}>
                                    <td><strong>{p.name}</strong></td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 200 }}>{p.description || '—'}</td>
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ display: 'flex' }}>
                                                {p.project_members?.slice(0, 4).map((m, i) => (
                                                    <div key={m.id} title={m.user?.full_name} style={{
                                                        width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)',
                                                        color: '#fff', fontSize: 11, fontWeight: 700,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        marginLeft: i > 0 ? -8 : 0, border: '2px solid var(--surface)',
                                                        zIndex: 4 - i, flexShrink: 0,
                                                    }}>
                                                        {m.user?.full_name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                ))}
                                                {p.project_members?.length > 4 && (
                                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--border)', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -8 }}>
                                                        +{p.project_members.length - 4}
                                                    </div>
                                                )}
                                            </div>
                                            {p.project_members?.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>None</span>}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: 13 }}>{p.creator?.full_name || '—'}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDate(p.created_at)}</td>
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

            {modal === 'create' && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal">
                        <div className="modal-header"><h2 className="modal-title">New Project</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-group"><label className="form-label">Project Name</label><input className="form-input" value={form.name} onChange={f('name')} required /></div>
                                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows={3} value={form.description} onChange={f('description')} style={{ resize: 'vertical' }} /></div>
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
                                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows={3} value={form.description} onChange={f('description')} style={{ resize: 'vertical' }} /></div>
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
