import { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Pencil, Trash2, X, Calendar, ShieldCheck, AlertCircle } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const PRIORITY_BADGE = { low: 'badge-blue', medium: 'badge-yellow', high: 'badge-red' }
const STATUS_BADGE = { pending: 'badge-gray', in_progress: 'badge-yellow', done: 'badge-green', verified: 'badge-purple', failed: 'badge-red' }

const EMPTY_FORM = { project_id: '', title: '', description: '', assigned_to: '', status: 'pending', priority: 'medium', estimated_hours: '', actual_hours: '', end_time: '', qa_notes: '' }

import DateRangePicker from '../../components/DateRangePicker'

export default function TasksPage() {
    const { hasPermission, hasRole, user } = useAuth()
    const canCreate = hasPermission('assign_task')
    const canUpdate = hasPermission('update_task')
    const canDelete = hasPermission('delete_task')
    const isManager = hasPermission('manage_projects') || hasPermission('manage_employees')

    const [tasks, setTasks] = useState([])
    const [projects, setProjects] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null)
    const [selected, setSelected] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const location = useLocation()
    const [filters, setFilters] = useState({
        project_id: location.state?.project_id || '',
        status: location.state?.status || '',
        assigned_to: location.state?.assigned_to || '',
        startDate: location.state?.startDate || '',
        endDate: location.state?.endDate || ''
    })
    const [qaReport, setQaReport] = useState({ status: '', notes: '' })

    const load = useCallback(() => {
        setLoading(true)
        const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
        Promise.all([
            api.get('/tasks', { params }),
            api.get('/projects'),
            isManager ? api.get('/users', { params: { role: 'developer' } }) : Promise.resolve({ data: { data: [] } }),
        ])
            .then(([t, p, u]) => {
                const taskList = t.data.data
                setTasks(taskList)
                setProjects(p.data.data)
                setUsers(u.data.data)

                // Check for taskId in location state to open modal automatically
                const autoTaskId = location.state?.openTaskId
                if (autoTaskId) {
                    const taskToOpen = taskList.find(item => item.id === autoTaskId)
                    if (taskToOpen) {
                        openEdit(taskToOpen)
                    }
                }
            })
            .catch(err => toast.error(err.message))
            .finally(() => setLoading(false))
    }, [filters, isManager, location.state?.openTaskId])

    useEffect(() => { load() }, [filters])

    useEffect(() => {
        if (location.state) {
            const newState = {
                project_id: location.state.project_id || '',
                status: location.state.status || '',
                assigned_to: location.state.assigned_to || '',
                startDate: location.state.startDate || '',
                endDate: location.state.endDate || ''
            };

            setFilters(newState);

            if (location.state.openCreateModal) {
                openCreate();
            }

            // Clear the state to avoid sticky filters on refresh or back navigation
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const openCreate = () => {
        setForm({ ...EMPTY_FORM, assigned_to: isManager ? '' : user?.id })
        setModal('create')
    }
    const openEdit = (t) => {
        setSelected(t)
        setForm({
            project_id: t.project?.id || '',
            title: t.title,
            description: t.description || '',
            assigned_to: t.assignee?.id || '',
            status: t.status,
            priority: t.priority || 'medium',
            estimated_hours: t.estimated_hours || '',
            actual_hours: t.actual_hours || '',
            end_time: t.end_time ? t.end_time.slice(0, 10) : '',
        })
        setModal('edit')
    }
    const openQaModal = (t, status) => {
        setSelected(t)
        setQaReport({ status, notes: t.qa_notes || '' })
        setModal('qa_report')
    }
    const openDelete = (t) => { setSelected(t); setModal('delete') }
    const closeModal = () => { setModal(null); setSelected(null) }

    const handleCreate = async (e) => {
        e.preventDefault(); setSaving(true)
        const payload = {
            ...form,
            estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : undefined,
            actual_hours: form.actual_hours ? Number(form.actual_hours) : undefined,
            assigned_to: form.assigned_to || undefined,
            end_time: form.end_time || undefined,
        }
        if (!payload.estimated_hours) delete payload.estimated_hours
        if (!payload.actual_hours) delete payload.actual_hours
        if (!payload.assigned_to) delete payload.assigned_to
        if (!payload.end_time) delete payload.end_time
        try { await api.post('/tasks', payload); toast.success('Task created'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleEdit = async (e) => {
        e.preventDefault(); setSaving(true)
        const payload = {
            ...form,
            estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : undefined,
            actual_hours: form.actual_hours ? Number(form.actual_hours) : undefined,
            assigned_to: form.assigned_to || undefined,
            end_time: form.end_time || undefined,
        }
        if (!payload.estimated_hours) delete payload.estimated_hours
        if (!payload.actual_hours) delete payload.actual_hours
        if (!payload.assigned_to) delete payload.assigned_to
        if (!payload.end_time) delete payload.end_time
        try { await api.patch(`/tasks/${selected.id}`, payload); toast.success('Task updated'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleDelete = async () => {
        setSaving(true)
        try { await api.delete(`/tasks/${selected.id}`); toast.success('Task deleted'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleQaReport = async (e) => {
        e.preventDefault(); setSaving(true)
        try {
            await api.patch(`/tasks/${selected.id}`, {
                status: qaReport.status,
                qa_notes: qaReport.notes
            });
            toast.success(`Task ${qaReport.status === 'verified' ? 'verified' : 'marked as failed'}`);
            load();
            closeModal();
        } catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
    const ff = (k) => (e) => setFilters(p => ({ ...p, [k]: e.target.value }))

    const formBody = () => (
        <>
            <div className="form-group">
                <label className="form-label">Project</label>
                <select className="form-select" value={form.project_id} onChange={f('project_id')} required>
                    <option value="">Select project…</option>
                    {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Task Title</label>
                <input className="form-input" value={form.title} onChange={f('title')} required />
            </div>
            <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={2} value={form.description} onChange={f('description')} style={{ resize: 'vertical' }} />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Assigned To</label>
                    <select className="form-select" value={form.assigned_to} onChange={f('assigned_to')} disabled={!isManager}>
                        {isManager ? (
                            <>
                                <option value="">Unassigned</option>
                                {(users || []).map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                            </>
                        ) : (
                            <option value={user?.id}>{user?.full_name}</option>
                        )}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Estimated Hours</label>
                    <input type="number" step="0.5" min="0" className="form-input" value={form.estimated_hours} onChange={f('estimated_hours')} placeholder="0.0" />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={f('status')}>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                        <option value="verified">Verified</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={form.priority} onChange={f('priority')}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
            </div>
            <div className="form-group">
                <label className="form-label">Actual Hours (manual)</label>
                <input type="number" step="0.5" min="0" className="form-input" value={form.actual_hours} onChange={f('actual_hours')} placeholder="0.0" />
            </div>
            <div className="form-group">
                <label className="form-label"><Calendar size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />Due Date</label>
                <input type="date" className="form-input" value={form.end_time ? form.end_time.slice(0, 10) : ''} onChange={f('end_time')} />
            </div>
        </>
    )

    return (
        <div>
            <div className="page-header" style={{ alignItems: 'flex-start' }}>
                <div><h1>Tasks</h1><p>Track and manage your project tasks</p></div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <DateRangePicker
                        startDate={filters.startDate}
                        endDate={filters.endDate}
                        onRangeChange={(range) => setFilters(prev => ({ ...prev, ...range }))}
                    />
                    {canCreate && <button className="btn btn-primary" onClick={openCreate} style={{ height: '42px' }}><Plus size={16} />New Task</button>}
                </div>
            </div>

            <div className="table-wrapper">
                <div className="table-toolbar">
                    <div className="table-filters">
                        <select className="form-select" style={{ width: 160 }} value={filters.project_id} onChange={ff('project_id')}>
                            <option value="">All Projects</option>
                            {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select className="form-select" style={{ width: 140 }} value={filters.status} onChange={ff('status')}>
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                            <option value="verified">Verified</option>
                            <option value="failed">Failed</option>
                        </select>
                        {isManager && (
                            <select className="form-select" style={{ width: 160 }} value={filters.assigned_to} onChange={ff('assigned_to')}>
                                <option value="">All Assignees</option>
                                {(users || []).map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                            </select>
                        )}
                        {(filters.startDate || filters.endDate) && (
                            <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '8px 12px', height: '38px', marginLeft: 'auto' }}
                                onClick={() => setFilters(prev => ({ ...prev, startDate: '', endDate: '' }))}
                            >
                                <X size={14} style={{ marginRight: '6px' }} /> Clear Dates
                            </button>
                        )}
                    </div>
                </div>

                {loading ? <div className="page-loader"><div className="spinner" /></div> : (
                    <table>
                        <thead><tr>
                            <th>Title</th><th>Project</th><th>Assignee</th><th>Status</th><th>Priority</th><th>Created</th><th>Due Date</th><th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {tasks.length === 0 && <tr><td colSpan={8}><div className="empty-state"><p>No tasks found</p></div></td></tr>}
                            {(tasks || []).map(t => (
                                <tr key={t.id}>
                                    <td><strong style={{ fontSize: 13 }}>{t.title}</strong></td>
                                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.project?.name || '—'}</td>
                                    <td style={{ fontSize: 12 }}>{t.assignee?.full_name || '—'}</td>
                                    <td><span className={`badge ${STATUS_BADGE[t.status] || 'badge-gray'}`}>{t.status?.replace('_', ' ')}</span></td>
                                    <td><span className={`badge ${PRIORITY_BADGE[t.priority] || 'badge-gray'}`}>{t.priority}</span></td>
                                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                                    </td>
                                    <td>
                                        {t.end_time ? (() => {
                                            const due = new Date(t.end_time)
                                            const isOverdue = due < new Date() && t.status !== 'done'
                                            return (
                                                <span style={{
                                                    fontSize: 12, fontWeight: 600,
                                                    color: isOverdue ? 'var(--danger)' : 'var(--text-muted)',
                                                    display: 'flex', alignItems: 'center', gap: 4
                                                }}>
                                                    {isOverdue && <span title="Overdue">🔴</span>}
                                                    {due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                </span>
                                            )
                                        })() : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>}
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            {(hasRole('Tester') || hasRole('super_admin')) && (t.status === 'done' || t.status === 'in_progress') && (
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <button
                                                        className="btn btn-ghost btn-sm btn-icon"
                                                        style={{ color: '#10b981' }}
                                                        onClick={() => openQaModal(t, 'verified')}
                                                        title="Pass / Verify"
                                                    >
                                                        <ShieldCheck size={14} />
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-sm btn-icon"
                                                        style={{ color: '#ef4444' }}
                                                        onClick={() => openQaModal(t, 'failed')}
                                                        title="Fail / Rejected"
                                                    >
                                                        <AlertCircle size={14} />
                                                    </button>
                                                </div>
                                            )}
                                            {canUpdate && <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(t)}><Pencil size={14} /></button>}
                                            {canDelete && <button className="btn btn-danger btn-sm btn-icon" onClick={() => openDelete(t)}><Trash2 size={14} /></button>}
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
                    <div className="modal modal-lg">
                        <div className="modal-header"><h2 className="modal-title">New Task</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <form onSubmit={handleCreate}><div className="modal-body">{formBody()}</div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create Task'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modal === 'edit' && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal modal-lg">
                        <div className="modal-header"><h2 className="modal-title">Edit Task</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <form onSubmit={handleEdit}><div className="modal-body">{formBody()}</div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modal === 'delete' && selected && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal" style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h2 className="modal-title">Delete Task</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <div className="modal-body"><p style={{ fontSize: 14 }}>Delete task <strong>{selected.title}</strong>? This cannot be undone.</p></div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</button>
                        </div>
                    </div>
                </div>
            )}
            {modal === 'qa_report' && selected && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">QA Report: {qaReport.status === 'verified' ? 'Pass' : 'Fail'}</h2>
                            <button className="btn-icon" onClick={closeModal}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleQaReport}>
                            <div className="modal-body">
                                <p style={{ fontSize: 13, marginBottom: 12, color: 'var(--text-muted)' }}>
                                    Task: <strong>{selected.title}</strong>
                                </p>
                                <div className="form-group">
                                    <label className="form-label">QA Notes / Reason</label>
                                    <textarea
                                        className="form-textarea"
                                        rows={4}
                                        value={qaReport.notes}
                                        onChange={e => setQaReport(p => ({ ...p, notes: e.target.value }))}
                                        placeholder={qaReport.status === 'verified' ? 'Optional: Testing notes...' : 'Required: Why did it fail?'}
                                        required={qaReport.status === 'failed'}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : `Submit ${qaReport.status === 'verified' ? 'Pass' : 'Fail'}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
