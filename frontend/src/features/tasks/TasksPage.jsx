import { useEffect, useState, useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, X, Calendar, ShieldCheck, AlertCircle, Download, FileText, RotateCcw, Clock, Search, CheckCircle } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import DataTable from '../../components/common/DataTable'
import QAFeedbackTrail from '../../components/common/QAFeedbackTrail'
import { formatDate, formatDateTime } from '../../utils/formatters'
import DateRangePicker from '../../components/DateRangePicker'

const PRIORITY_BADGE = { low: 'badge-blue', medium: 'badge-yellow', high: 'badge-red' }
const STATUS_BADGE = { pending: 'badge-gray', in_progress: 'badge-yellow', done: 'badge-green', verified: 'badge-purple', failed: 'badge-red' }

const EMPTY_FORM = { project_id: '', title: '', description: '', assigned_to: '', status: 'pending', priority: 'medium', estimated_hours: '', actual_hours: '', end_time: '', qa_notes: '' }

export default function TasksPage() {
    const { hasPermission, hasRole, user } = useAuth()
    const canCreate = hasPermission('assign_task')
    const canUpdate = hasPermission('update_task')
    const canDelete = hasPermission('delete_task')
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
            isManager ? api.get('/users', { params: { role: 'developer,Tester,HR,Video Editor' } }) : Promise.resolve({ data: { data: [] } }),
        ])
            .then(([t, p, u]) => {
                const taskList = t.data.data
                setTasks(taskList)
                setProjects(p.data.data)
                setUsers(u.data.data)

                const autoTaskId = location.state?.openTaskId
                if (autoTaskId) {
                    const taskToOpen = taskList.find(item => item.id === autoTaskId)
                    if (taskToOpen) openEdit(taskToOpen)
                }
            })
            .catch(err => toast.error(err.message))
            .finally(() => setLoading(false))
    }, [filters, isManager, location.state?.openTaskId])

    useEffect(() => { load() }, [filters])

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
    const closeModal = () => { setModal(null); setSelected(null) }

    const handleCreate = async (e) => {
        e.preventDefault();
        if (/^\d+$/.test(form.title)) return toast.error('Task title cannot be purely numeric');
        setSaving(true)
        const payload = { 
            ...form,
            estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : undefined,
            actual_hours: form.actual_hours ? parseFloat(form.actual_hours) : undefined
        }
        try { await api.post('/tasks', payload); toast.success('Task created'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleEdit = async (e) => {
        e.preventDefault();
        if (/^\d+$/.test(form.title)) return toast.error('Task title cannot be purely numeric');
        setSaving(true)
        const payload = { 
            ...form,
            estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : undefined,
            actual_hours: form.actual_hours ? parseFloat(form.actual_hours) : undefined
        }
        const isResubmitting = selected?.status === 'failed' && form.developer_reply?.trim();
        // REMOVED: Auto-update status to 'done'. Let the user choose.

        try {
            await api.patch(`/tasks/${selected.id}`, payload);
            if (isResubmitting) {
                await api.post(`/tasks/${selected.id}/feedback`, {
                    content: form.developer_reply,
                    new_status: form.status
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

    const columns = useMemo(() => [
        { label: 'Date', key: 'created_at', type: 'date', width: '180px', render: (val) => formatDateTime(val) },
        { 
            label: 'Due Date', 
            key: 'end_time', 
            type: 'date', 
            width: '180px',
            render: (val, t) => {
                if (!val) return '—';
                const due = new Date(val);
                const isOverdue = due < new Date() && !['done', 'verified'].includes(t.status);
                return (
                    <span style={{ color: isOverdue ? 'var(--danger)' : 'inherit', fontWeight: isOverdue ? 700 : 400 }}>
                        {formatDate(val)}
                    </span>
                );
            }
        },
        { 
            label: 'Task', 
            key: 'title', 
            width: '250px', 
            copyable: true,
            render: (val, t) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontWeight: 600 }}>{val}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{t.project?.name}</div>
                </div>
            )
        },
        { label: 'Assignee', key: 'assignee.full_name', width: '150px' },
        { 
            label: 'Status', 
            key: 'status', 
            type: 'status', 
            width: '120px', 
            render: (val) => <span className={`badge ${STATUS_BADGE[val] || 'badge-gray'}`}>{val?.replace('_', ' ')}</span> 
        },
        { 
            label: 'Priority', 
            key: 'priority', 
            type: 'status', 
            width: '100px', 
            render: (val) => <span className={`badge ${PRIORITY_BADGE[val] || 'badge-gray'}`}>{val}</span> 
        },
        {
            label: 'QA Notes',
            key: 'qa_notes',
            width: '200px',
            render: (val, t) => val ? (
                <div style={{ fontSize: '11px', color: t.status === 'failed' ? 'var(--danger)' : 'var(--text-dim)', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px' }} title={val}>
                    {val.length > 50 ? val.substring(0, 50) + '...' : val}
                </div>
            ) : '—'
        },
        {
            label: 'Actions',
            key: 'actions',
            width: '140px',
            render: (_, t) => (
                <div className="actions-cell">
                    {canUpdate && <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); openEdit(t); }} title="Edit"><Pencil size={14} /></button>}
                    {canDelete && <button className="btn btn-danger btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); openDelete(t); }} title="Delete"><Trash2 size={14} /></button>}
                </div>
            )
        }
    ], [canUpdate, canDelete]);

    const bulkActions = useMemo(() => [
        {
            label: 'Complete Selected',
            icon: <CheckCircle size={14} />,
            handler: async (rows) => {
                if (window.confirm(`Mark ${rows.length} tasks as Done?`)) {
                    try {
                        await Promise.all(rows.map(r => api.patch(`/tasks/${r.id}`, { status: 'done' })));
                        toast.success('Tasks updated');
                        load();
                    } catch (err) { toast.error(err.message); }
                }
            }
        },
        {
            label: 'Delete Selected',
            icon: <Trash2 size={14} />,
            handler: async (rows) => {
                if (window.confirm(`Delete ${rows.length} tasks?`)) {
                    try {
                        await Promise.all(rows.map(r => api.delete(`/tasks/${r.id}`)));
                        toast.success('Tasks deleted');
                        load();
                    } catch (err) { toast.error(err.message); }
                }
            }
        }
    ], [load]);

    const openDelete = (t) => { setSelected(t); setModal('delete') }

    const formBody = () => {
        const isLocked = !isManager && ['done', 'ready_for_qa', 'verified', 'failed'].includes(selected?.status);
        const isFailed = selected?.status === 'failed';

        return (
            <div className="split-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) 1fr', minHeight: '500px' }}>
                <div className="history-pane" style={{ padding: '24px', background: 'rgba(0,0,0,0.1)', borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
                    <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '16px', letterSpacing: '0.05em' }}>Communication Logs</h4>
                    {selected ? <QAFeedbackTrail type="task" itemId={selected.id} /> : <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '40px 0' }}>History will appear after task creation.</div>}
                </div>
                <div className="form-pane" style={{ padding: '24px', overflowY: 'auto' }}>
                    <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '16px', letterSpacing: '0.05em' }}>Task Information</h4>
                    <div className="form-group">
                        <label className="form-label">Project</label>
                        <select className="form-select" value={form.project_id} onChange={e => setForm(p => ({ ...p, project_id: e.target.value }))} required disabled={isLocked}>
                            <option value="">Select project…</option>
                            {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Task Title</label>
                        <input className="form-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required disabled={isLocked} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" rows={6} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} disabled={isLocked} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Assigned To</label>
                            <select className="form-select" value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))} disabled={!isManager || isLocked}>
                                {isManager ? (
                                    <><option value="">Unassigned</option>{(users || []).map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}</>
                                ) : <option value={user?.id}>{user?.full_name}</option>}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Estimated Hours</label>
                            <input type="number" step="0.5" min="0" className="form-input" value={form.estimated_hours} onChange={e => setForm(p => ({ ...p, estimated_hours: e.target.value }))} disabled={isLocked} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} disabled={isLocked && !isFailed}>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="done">Done (Submit for QA)</option>
                                {isManager && <><option value="verified">Verified</option><option value="failed">Failed</option></>}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Priority</label>
                            <select className="form-select" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} disabled={isLocked}>
                                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group" style={{ marginTop: '14px' }}>
                        <label className="form-label">Due Date</label>
                        <input type="date" className="form-input" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} disabled={isLocked} />
                    </div>
                    {isFailed && (
                        <div className="form-group" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: 16, borderRadius: 12, marginTop: 20, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <label className="form-label" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}><RotateCcw size={14} /> Resubmit Notes</label>
                            <textarea className="form-textarea" rows={4} value={form.developer_reply} onChange={e => setForm(p => ({ ...p, developer_reply: e.target.value }))} placeholder="Explain the fix..." style={{ marginTop: 8 }} />
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="tasks-page">
            <div className="page-header">
                <div><h1>Tasks</h1><p>Track and manage your project tasks</p></div>
                <div className="header-actions">
                    <DateRangePicker startDate={filters.startDate} endDate={filters.endDate} onRangeChange={(r) => setFilters(p => ({ ...p, ...r }))} />
                    {canCreate && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Task</button>}
                </div>
            </div>

            <div className="card polished-card filter-bar">
                <div className="filter-row">
                    <select className="form-select" style={{ width: 180 }} value={filters.project_id} onChange={e => setFilters(p => ({ ...p, project_id: e.target.value }))}>
                        <option value="">All Projects</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className="form-select" style={{ width: 150 }} value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
                        <option value="">All Status</option>
                        {['pending', 'in_progress', 'done', 'verified', 'failed'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                    {isManager && (
                        <select className="form-select" style={{ width: 180 }} value={filters.assigned_to} onChange={e => setFilters(p => ({ ...p, assigned_to: e.target.value }))}>
                            <option value="">All Assignees</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                        </select>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={load}>Apply Filters</button>
                    {(filters.startDate || filters.endDate) && <button className="btn btn-ghost btn-sm" onClick={() => setFilters(p => ({ ...p, startDate: '', endDate: '' }))}><X size={14} /> Clear Dates</button>}
                </div>
            </div>

            <div className="card table-card">
                <DataTable
                    data={tasks}
                    columns={columns}
                    loading={loading}
                    fileName="tasks_export"
                    selectable={canUpdate}
                    bulkActions={canUpdate ? bulkActions : []}
                    onRowClick={(t) => openEdit(t)}
                    onAdd={openCreate}
                />
            </div>

            {modal === 'create' && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal modal-lg">
                        <div className="modal-header"><h2>New Task</h2><button onClick={closeModal}><X size={18} /></button></div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">{formBody()}</div>
                            <div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>Create Task</button></div>
                        </form>
                    </div>
                </div>
            )}

            {modal === 'edit' && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal modal-lg">
                        <div className="modal-header"><h2>Edit Task</h2><button onClick={closeModal}><X size={18} /></button></div>
                        <form onSubmit={handleEdit}>
                            <div className="modal-body">{formBody()}</div>
                            <div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>Save Changes</button></div>
                        </form>
                    </div>
                </div>
            )}

            {modal === 'delete' && selected && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal" style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h2>Delete Task</h2><button onClick={closeModal}><X size={18} /></button></div>
                        <div className="modal-body"><p>Are you sure you want to delete <strong>{selected.title}</strong>?</p></div>
                        <div className="modal-footer"><button className="btn btn-ghost" onClick={closeModal}>Cancel</button><button className="btn btn-danger" onClick={handleDelete} disabled={saving}>Delete</button></div>
                    </div>
                </div>
            )}

            <style>{`
                .tasks-page { padding: 8px; }
                .header-actions { display: flex; gap: 12px; align-items: center; }
                .filter-bar { margin-bottom: 20px; padding: 12px; }
                .filter-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
                .badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
                .badge-gray { background: rgba(107, 114, 128, 0.1); color: #6b7280; }
                .badge-yellow { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .badge-green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .badge-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .badge-purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
                .badge-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .actions-cell { display: flex; gap: 4px; justify-content: center; }
                .split-body { min-height: 500px; }
            `}</style>
        </div>
    )
}
