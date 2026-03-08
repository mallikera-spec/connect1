import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, X, Calendar, ShieldCheck, AlertCircle, Download, FileText, RotateCcw, Clock, Search } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import DataTable from '../../components/common/DataTable'
import QAFeedbackTrail from '../../components/common/QAFeedbackTrail'

const PRIORITY_BADGE = { low: 'badge-blue', medium: 'badge-yellow', high: 'badge-red' }
const STATUS_BADGE = { pending: 'badge-gray', in_progress: 'badge-yellow', done: 'badge-green', verified: 'badge-purple', failed: 'badge-red' }

const EMPTY_FORM = { project_id: '', title: '', description: '', assigned_to: '', status: 'pending', priority: 'medium', estimated_hours: '', actual_hours: '', end_time: '', qa_notes: '' }

import DateRangePicker from '../../components/DateRangePicker'

export default function TasksPage() {
    const { hasPermission, hasRole, user } = useAuth()
    const canCreate = hasPermission('assign_task')
    const canUpdate = hasPermission('update_task')
    const canDelete = hasRole('super_admin') || hasRole('director') || hasRole('Director')
    const isManager = hasPermission('manage_projects') || hasPermission('manage_employees')
    const location = useLocation()
    const navigate = useNavigate()

    const [tasks, setTasks] = useState([])
    const [projects, setProjects] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null)
    const [selected, setSelected] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
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
        if (location.state && Object.keys(location.state).length > 0) {
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

            // Safely clear the location state via React Router so it doesn't persist on refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, location.pathname, navigate]);

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
            developer_reply: t.developer_reply || '',
            qa_notes: t.qa_notes || '',
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
            developer_reply: form.developer_reply || undefined
        }

        // Prevent overwriting qa_notes with empty string if not explicitly intended
        if (!payload.qa_notes) delete payload.qa_notes

        const isResubmitting = selected?.status === 'failed' && form.developer_reply?.trim();
        if (isResubmitting) {
            payload.status = 'done'
        }
        if (!payload.estimated_hours) delete payload.estimated_hours
        if (!payload.actual_hours) delete payload.actual_hours
        if (!payload.assigned_to) delete payload.assigned_to
        if (!payload.end_time) delete payload.end_time
        try {
            await api.patch(`/tasks/${selected.id}`, payload);

            // If resubmitting, add the reply to feedback trail
            if (isResubmitting) {
                await api.post(`/tasks/${selected.id}/feedback`, {
                    content: form.developer_reply,
                    new_status: 'done'
                });
            }

            toast.success('Task updated');
            load();
            closeModal();
        }
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



    const formBody = () => {
        const isLocked = !isManager && ['done', 'ready_for_qa', 'verified', 'failed'].includes(selected?.status);
        const isFailed = selected?.status === 'failed';
        const isEditable = !isLocked;

        return (
            <div className="split-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) 1fr', minHeight: '500px' }}>
                {/* Left Side: History */}
                <div className="history-pane" style={{ padding: '24px', background: 'rgba(0,0,0,0.1)', borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
                    <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '16px', letterSpacing: '0.05em' }}>
                        Communication Logs
                    </h4>
                    {selected ? (
                        <QAFeedbackTrail type="task" itemId={selected.id} />
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '40px 0' }}>
                            History will appear after task creation.
                        </div>
                    )}
                </div>

                {/* Right Side: Form */}
                <div className="form-pane" style={{ padding: '24px', overflowY: 'auto' }}>
                    <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '16px', letterSpacing: '0.05em' }}>
                        Task Information
                    </h4>

                    <div className="form-group">
                        <label className="form-label">Project</label>
                        <select className="form-select" value={form.project_id} onChange={f('project_id')} required disabled={isLocked}>
                            <option value="">Select project…</option>
                            {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Task Title</label>
                        <input className="form-input" value={form.title} onChange={f('title')} required disabled={isLocked} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" rows={6} value={form.description} onChange={f('description')} style={{ resize: 'vertical' }} disabled={isLocked} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Assigned To</label>
                            <select className="form-select" value={form.assigned_to} onChange={f('assigned_to')} disabled={!isManager || isLocked}>
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
                            <input type="number" step="0.5" min="0" className="form-input" value={form.estimated_hours} onChange={f('estimated_hours')} placeholder="0.0" disabled={isLocked} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={form.status}
                                onChange={f('status')}
                                disabled={isLocked && !isFailed}
                            >
                                <option value="pending" disabled={isLocked}>Pending</option>
                                <option value="in_progress" disabled={isLocked}>In Progress</option>
                                <option value="done">Done (Submit for QA)</option>
                                {isManager && (
                                    <>
                                        <option value="verified">Verified</option>
                                        <option value="failed">Failed</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Priority</label>
                            <select className="form-select" value={form.priority} onChange={f('priority')} disabled={isLocked}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    {isFailed && (
                        <div className="form-group" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: 16, borderRadius: 12, marginTop: 20, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <label className="form-label" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <RotateCcw size={14} /> Resubmit Notes
                            </label>
                            <textarea
                                className="form-textarea"
                                rows={4}
                                value={form.developer_reply}
                                onChange={f('developer_reply')}
                                placeholder="Explain the fix..."
                                style={{ marginTop: 8 }}
                            />
                            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
                                Mark status as <strong>Done</strong> to resubmit for testing.
                            </p>
                        </div>
                    )}

                    {isLocked && !isFailed && (
                        <div style={{ marginTop: 12, padding: 12, background: 'rgba(16, 185, 129, 0.05)', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: 12, textAlign: 'center' }}>
                            Submitted for QA. Details are locked.
                        </div>
                    )}
                </div>
            </div>
        )
    }

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

                <DataTable
                    data={tasks}
                    loading={loading}
                    fileName="tasks"
                    columns={[
                        {
                            label: 'Date',
                            key: 'created_at',
                            render: (val) => (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                                    {val ? new Date(val).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                                </span>
                            )
                        },
                        {
                            label: 'Due Date',
                            key: 'end_time',
                            render: (val, t) => {
                                if (!val) return <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>;
                                const due = new Date(val);
                                const isOverdue = due < new Date() && t.status !== 'done' && t.status !== 'verified';
                                return (
                                    <span style={{
                                        fontSize: 11, fontWeight: 600,
                                        color: isOverdue ? 'var(--danger)' : 'var(--text-muted)',
                                        display: 'flex', alignItems: 'center', gap: 4
                                    }}>
                                        {isOverdue && <span title="Overdue">🔴</span>}
                                        {due.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                );
                            }
                        },
                        {
                            label: 'QA Feedback',
                            key: 'qa_notes',
                            render: (val, t) => val ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 11,
                                    color: t.status === 'failed' ? '#ef4444' : 'var(--text-muted)',
                                    background: t.status === 'failed' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                    padding: '3px 8px',
                                    borderRadius: 4,
                                    width: 'fit-content',
                                    maxWidth: '200px'
                                }}>
                                    <AlertCircle size={12} fill="currentColor" />
                                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val}</span>
                                </div>
                            ) : <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>—</span>
                        },
                        {
                            label: 'Project',
                            key: 'project.name',
                            render: (val) => <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{val || '—'}</span>
                        },
                        {
                            label: 'Title',
                            key: 'title',
                            render: (val) => <strong style={{ fontSize: 13 }}>{val}</strong>
                        },
                        {
                            label: 'Assignee',
                            key: 'assignee.full_name',
                            render: (val) => <span style={{ fontSize: 12 }}>{val || '—'}</span>
                        },
                        {
                            label: 'Status',
                            key: 'status',
                            render: (val) => <span className={`badge ${STATUS_BADGE[val] || 'badge-gray'}`}>{val?.replace('_', ' ')}</span>
                        },
                        {
                            label: 'Priority',
                            key: 'priority',
                            render: (val) => <span className={`badge ${PRIORITY_BADGE[val] || 'badge-gray'}`}>{val}</span>
                        },
                        {
                            label: 'Actions',
                            key: 'id',
                            render: (_, t) => (
                                <div className="actions-cell">
                                    {canUpdate && <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}>Edit</button>}
                                    {canDelete && <button className="btn btn-danger btn-sm btn-icon" onClick={() => openDelete(t)}><Trash2 size={14} /></button>}
                                </div>
                            )
                        }
                    ]}
                />
            </div>

            {modal === 'create' && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal modal-lg" style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div className="modal-header"><h2 className="modal-title">New Task</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                            <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>{formBody()}</div>
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
                    <div className="modal modal-lg" style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div className="modal-header"><h2 className="modal-title">Edit Task</h2><button className="btn-icon" onClick={closeModal}><X size={18} /></button></div>
                        <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                            <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>{formBody()}</div>
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
                                {selected.description && (
                                    <div style={{ fontSize: 12, color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16, fontStyle: 'italic' }}>
                                        {selected.description}
                                    </div>
                                )}
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
