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
import TaskFormModal from './components/TaskFormModal'
import MoveToTimesheetModal from './components/MoveToTimesheetModal'

const PRIORITY_BADGE = { low: 'badge-blue', medium: 'badge-yellow', high: 'badge-red' }
const STATUS_BADGE = { pending: 'badge-gray', in_progress: 'badge-yellow', done: 'badge-green', verified: 'badge-purple', failed: 'badge-red' }

const EMPTY_FORM = { id: '', project_id: '', title: '', description: '', assigned_to: '', status: 'pending', priority: 'medium', estimated_hours: '', actual_hours: '', end_time: '', qa_notes: '' }

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
    const [selectedRows, setSelectedRows] = useState([])
    const [showMoveModal, setShowMoveModal] = useState(false)

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
            id: t.id,
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

    const handleCreate = async (formData) => {
        if (/^\d+$/.test(formData.title)) return toast.error('Task title cannot be purely numeric');
        setSaving(true)
        const payload = { 
            ...formData,
            estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : undefined,
            actual_hours: formData.actual_hours ? parseFloat(formData.actual_hours) : undefined
        }
        try { await api.post('/tasks', payload); toast.success('Task created'); load(); closeModal() }
        catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleEdit = async (formData) => {
        if (/^\d+$/.test(formData.title)) return toast.error('Task title cannot be purely numeric');
        setSaving(true)
        const payload = { 
            ...formData,
            estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : undefined,
            actual_hours: formData.actual_hours ? parseFloat(formData.actual_hours) : undefined
        }
        const isResubmitting = selected?.status === 'failed' && formData.developer_reply?.trim();

        try {
            await api.patch(`/tasks/${selected.id}`, payload);
            if (isResubmitting) {
                await api.post(`/tasks/${selected.id}/feedback`, {
                    content: formData.developer_reply,
                    new_status: formData.status
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
        },
        {
            label: 'Move to Timesheet',
            icon: <Clock size={14} />,
            handler: (rows) => {
                setSelectedRows(rows);
                setShowMoveModal(true);
            }
        }
    ], [load]);

    const filteredBulkActions = useMemo(() => {
        const actions = [];
        if (canUpdate) actions.push(bulkActions[0]); // Complete Selected
        if (canDelete) actions.push(bulkActions[1]); // Delete Selected
        
        // Move to Timesheet (Only for tasks assigned to the current user, or if admin)
        actions.push(bulkActions[2]); 
        
        return actions;
    }, [bulkActions, canUpdate, canDelete, user]);

    const openDelete = (t) => { setSelected(t); setModal('delete') }

    return (
        <div className="tasks-page">
            <div className="page-header">
                <div><h1>Tasks</h1><p>Track and manage your project tasks</p></div>
                <div className="header-actions">
                    <DateRangePicker startDate={filters.startDate} endDate={filters.endDate} onRangeChange={(r) => setFilters(p => ({ ...p, ...r }))} />
                    {canCreate && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Task</button>}
                </div>
            </div>

            <div className="card polished-card filter-bar animate-fade-in">
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
                    selectable={true}
                    bulkActions={filteredBulkActions}
                    onRowClick={(t) => openEdit(t)}
                    onAdd={openCreate}
                />
            </div>

            {modal === 'create' && (
                <TaskFormModal
                    isOpen={true}
                    onClose={closeModal}
                    initialData={form}
                    onSubmit={handleCreate}
                    projects={projects}
                    users={users}
                    isManager={isManager}
                    currentUser={user}
                    saving={saving}
                />
            )}

            {modal === 'edit' && (
                <TaskFormModal
                    isOpen={true}
                    onClose={closeModal}
                    initialData={form}
                    onSubmit={handleEdit}
                    projects={projects}
                    users={users}
                    isManager={isManager}
                    currentUser={user}
                    saving={saving}
                />
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

            {showMoveModal && (
                <MoveToTimesheetModal 
                    tasks={selectedRows}
                    onClose={() => setShowMoveModal(false)}
                    onSaved={load}
                />
            )}

            <style>{`
                .tasks-page { padding: 8px; }
                .header-actions { display: flex; gap: 12px; align-items: center; }
                .filter-bar { margin-bottom: 20px; padding: 16px; border-radius: 16px; }
                .filter-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
                .actions-cell { display: flex; gap: 4px; justify-content: center; }
                .split-body { min-height: 500px; }
            `}</style>
        </div>
    )
}
