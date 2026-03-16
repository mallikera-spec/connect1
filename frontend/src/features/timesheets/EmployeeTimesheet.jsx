import { useEffect, useState, useMemo } from 'react'
import { Plus, Trash2, Clock, Calendar, CheckCircle2, Target, TrendingUp, History, Edit } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import EditEntryModal from './EditEntryModal'
import DataTable from '../../components/common/DataTable'
import { formatDate } from '../../utils/formatters'
import DateRangePicker from '../../components/DateRangePicker'

const STATUS_OPTS = ['todo', 'in_progress', 'done']
const STATUS_BADGE = {
    todo: 'badge-gray',
    in_progress: 'badge-yellow',
    done: 'badge-green',
    verified: 'badge-purple',
    failed: 'badge-red'
}

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function EmployeeTimesheet() {
    const { user, hasPermission, hasRole } = useAuth()
    const location = useLocation()

    const [startDate, setStartDate] = useState(location.state?.startDate || todayISO())
    const [endDate, setEndDate] = useState(location.state?.endDate || todayISO())
    const [allEntries, setAllEntries] = useState([])
    const [myProjects, setMyProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState(null)
    const [report, setReport] = useState(null)
    const [filterProjectId, setFilterProjectId] = useState('')
    const [statusFilter, setStatusFilter] = useState(location.state?.statusFilter || '')

    // Form for new entry
    const [newDate, setNewDate] = useState(todayISO())
    const [newProjectId, setNewProjectId] = useState('')
    const [newTitle, setNewTitle] = useState('')
    const [newTime, setNewTime] = useState('00:00')
    const [newNotes, setNewNotes] = useState('')
    const [newStatus, setNewStatus] = useState('in_progress')
    const [adding, setAdding] = useState(false)
    const [editingEntry, setEditingEntry] = useState(null)

    const load = async () => {
        setLoading(true)
        try {
            const params = { startDate, endDate }
            const tsRes = await api.get('/timesheets/my-history', { params });
            const timesheets = tsRes.data.data;
            const flattened = timesheets.flatMap(ts =>
                (ts.entries || []).map(entry => ({
                    ...entry,
                    userName: ts.user?.full_name,
                    userId: ts.user_id,
                    date: ts.work_date
                }))
            );
            setAllEntries(flattened.sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const loadReport = async () => {
        try {
            const res = await api.get('/reports/me')
            setReport(res.data.data)
        } catch (_) { }
    }

    const loadMyProjects = async () => {
        try {
            const res = await api.get('/projects', { params: { memberUserId: user?.id } })
            setMyProjects(res.data.data)
        } catch (_) { }
    }

    useEffect(() => { loadMyProjects(); loadReport() }, [user?.id])
    useEffect(() => { load() }, [startDate, endDate])

    const handleAddEntry = async (e) => {
        e.preventDefault()

        if (!newTitle.trim() || !newProjectId || !newNotes.trim() || !newTime || newTime === '00:00') {
            return toast.error('Please fill all fields: Project, Activity, Time Commitment, and Notes are mandatory.')
        }
        setAdding(true)
        try {
            const tsRes = await api.get('/timesheets/me', { params: { date: newDate } })
            const tsId = tsRes.data.data.id

            const payload = {
                title: newTitle.trim(),
                status: newStatus,
                hours_spent: newTime,
                notes: newNotes,
                project_id: newProjectId || null
            }
            await api.post(`/timesheets/${tsId}/entries`, payload)

            setNewTitle('')
            setNewTime('00:00')
            setNewNotes('')
            setNewStatus('in_progress')
            toast.success('Activity logged!')
            load()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setAdding(false)
        }
    }

    const handleUpdate = async (entryId, updates) => {
        setSavingId(entryId)
        try {
            const entry = allEntries.find(e => e.id === entryId);
            const isResubmitting = entry?.status === 'failed' && updates.status === 'done';

            const res = await api.patch(`/timesheets/entries/${entryId}`, updates)
            const updated = res.data.data

            if (isResubmitting) {
                await api.post(`/timesheets/entries/${entryId}/feedback`, {
                    content: 'Resubmitted for QA',
                    new_status: 'done'
                });
            }

            setAllEntries(prev => prev.map(e => e.id === entryId ? { ...e, ...updated } : e))
            toast.success('Activity updated')
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSavingId(null)
        }
    }

    const handleDelete = async (entryId) => {
        if (!confirm('Remove this activity?')) return
        try {
            await api.delete(`/timesheets/entries/${entryId}`)
            setAllEntries(prev => prev.filter(e => e.id !== entryId))
            toast.success('Activity removed')
        } catch (err) { toast.error(err.message) }
    }

    const stats = useMemo(() => {
        const todayEntries = allEntries.filter(e => e.date === todayISO())
        const totalMinutes = todayEntries.reduce((acc, e) => {
            const [h, m] = e.hours_spent.split(':').map(Number)
            return acc + (h * 60) + m
        }, 0)
        const totalHours = (totalMinutes / 60).toFixed(1)
        const completed = todayEntries.filter(e => e.status === 'done').length
        const pendingTasks = report?.tasks_by_status ? (report.tasks_by_status.pending + report.tasks_by_status.in_progress) : 0
        return { totalHours, count: todayEntries.length, completed, pendingTasks }
    }, [allEntries, report])

    const filteredEntries = useMemo(() => {
        return allEntries.filter(e => {
            if (filterProjectId && e.project_id !== filterProjectId) return false
            if (statusFilter) {
                if (statusFilter === 'completed' && !['done', 'verified', 'failed'].includes(e.status)) return false;
                if (statusFilter === 'audited' && !['verified', 'failed'].includes(e.status)) return false;
                if (statusFilter === 'pending_qa' && e.status !== 'done') return false;
                if (!['completed', 'audited', 'pending_qa'].includes(statusFilter) && e.status !== statusFilter) return false;
            }
            return true
        })
    }, [allEntries, filterProjectId, statusFilter])

    const columns = useMemo(() => [
        { 
            label: 'Date', 
            key: 'date', 
            width: '120px',
            render: (val) => formatDate(val)
        },
        { 
            label: 'Project', 
            key: 'project.name', 
            width: '150px',
            render: (val) => <span className="badge badge-purple" style={{ fontSize: 9 }}>{(val || 'In-House').toUpperCase()}</span>
        },
        {
            label: 'Activity',
            key: 'title',
            wrap: true,
            copyable: true,
            render: (val, e) => (
                <div style={{ minWidth: 250 }}>
                    <div style={{ fontWeight: 600 }}>{val}</div>
                    {e.notes && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, fontStyle: 'italic' }}>{e.notes}</div>}
                </div>
            )
        },
        { label: 'Time', key: 'hours_spent', width: '80px', type: 'number', render: (val) => <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{val}</span> },
        {
            label: 'Status',
            key: 'status',
            width: '120px',
            render: (val, e) => {
                const isLocked = !['admin', 'super_admin', 'director'].some(r => user?.roles?.some(ur => (typeof ur === 'string' ? ur : ur.name).toLowerCase().includes(r))) && ['done', 'verified', 'failed'].includes(val);
                const isFailed = val === 'failed';

                if (isLocked && !isFailed) {
                    return <span className={`badge ${STATUS_BADGE[val] || ''}`} style={{ width: '100%', display: 'block', textAlign: 'center' }}>{val.toUpperCase()}</span>;
                }

                return (
                    <select
                        className={`form-select-badge ${STATUS_BADGE[val] || ''}`}
                        value={val}
                        onChange={ev => handleUpdate(e.id, { status: ev.target.value })}
                        onClick={ev => ev.stopPropagation()}
                        style={{ textTransform: 'uppercase', fontSize: 10 }}
                    >
                        {STATUS_OPTS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        {isFailed && <option value="done">DONE (RESUBMIT)</option>}
                    </select>
                );
            }
        },
        {
            label: 'QA result',
            key: 'status',
            width: '120px',
            render: (val) => {
                if (val === 'verified') return <span className="badge badge-green" style={{ width: '100%', display: 'block', textAlign: 'center' }}>PASS</span>;
                if (val === 'failed') return <span className="badge badge-red" style={{ width: '100%', display: 'block', textAlign: 'center' }}>FAIL</span>;
                if (['done', 'ready_for_qa'].includes(val)) return <span className="badge badge-yellow" style={{ width: '100%', display: 'block', textAlign: 'center' }}>UNDER REVIEW</span>;
                return <span className="badge badge-gray" style={{ width: '100%', display: 'block', textAlign: 'center' }}>PENDING</span>;
            }
        },
        { 
            label: 'Feedback', 
            key: 'id', 
            width: '150px',
            render: (_, e) => (
                <div style={{ fontSize: 11 }}>
                    {e.qa_notes && <div style={{ color: 'var(--danger)', fontWeight: 600 }}>QA: {e.qa_notes}</div>}
                    {e.admin_feedback && <div style={{ color: 'var(--text-dim)' }}>Admin: {e.admin_feedback}</div>}
                    {!e.qa_notes && !e.admin_feedback && <span style={{ opacity: 0.2 }}>—</span>}
                </div>
            )
        },
        {
            label: 'Actions',
            key: 'id',
            width: '80px',
            sticky: true,
            render: (_, e) => (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button className="btn btn-icon btn-sm" onClick={(ev) => { ev.stopPropagation(); setEditingEntry(e); }}><Edit size={14} /></button>
                    {(hasRole('super_admin') || hasRole('director') || hasRole('Director')) && (
                        <button className="btn btn-icon btn-sm btn-danger-ghost" onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }}><Trash2 size={14} /></button>
                    )}
                </div>
            )
        }
    ], [user, hasRole]);

    return (
        <div className="employee-timesheet">
            <div className="page-header">
                <div>
                    <h1>Activity Hub</h1>
                    <p>Track your flow, conquer your day.</p>
                </div>
                <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onRangeChange={(range) => {
                        setStartDate(range.startDate);
                        setEndDate(range.endDate);
                    }}
                />
            </div>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
                <div className="card shadow-sm stat-card">
                    <div className="stat-icon-circle purple"><Clock size={20} /></div>
                    <div>
                        <div className="stat-value">{stats.totalHours}h</div>
                        <div className="stat-label">Logged Today</div>
                    </div>
                </div>
                <div className="card shadow-sm stat-card">
                    <div className="stat-icon-circle yellow"><CheckCircle2 size={20} /></div>
                    <div>
                        <div className="stat-value">{stats.pendingTasks}</div>
                        <div className="stat-label">Pending Tasks</div>
                    </div>
                </div>
                <div className="card shadow-sm stat-card">
                    <div className="stat-icon-circle green"><Target size={20} /></div>
                    <div>
                        <div className="stat-value">{stats.completed}</div>
                        <div className="stat-label">Done Today</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
                <div className="grid-column">
                    <div className="card polished-card" style={{ padding: 24 }}>
                        <div className="section-title" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <TrendingUp size={18} className="text-accent" />
                            <h3 style={{ margin: 0, fontSize: 16 }}>Plan Activity</h3>
                        </div>
                        <form onSubmit={handleAddEntry} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="form-group">
                                <label className="form-label">Date</label>
                                <input type="date" className="form-input" value={newDate} onChange={e => setNewDate(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Project</label>
                                <select className="form-select" value={newProjectId} onChange={e => setNewProjectId(e.target.value)}>
                                    <option value="">Select Scope...</option>
                                    {myProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Task Description</label>
                                <input className="form-input" placeholder="e.g. Building login screen" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Time (hh:mm)</label>
                                <input type="time" className="form-input" value={newTime} onChange={e => setNewTime(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea className="form-input" placeholder="Brief details..." value={newNotes} onChange={e => setNewNotes(e.target.value)} rows={3} required />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={adding || !newTitle.trim() || !newProjectId || !newNotes.trim() || !newTime || newTime === '00:00'}>
                                {adding ? <span className="spinner-sm" /> : <><Plus size={18} /> Log Activity</>}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="grid-column">
                    <div className="card table-card" style={{ padding: 0 }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <History size={18} className="text-accent" />
                                <h3 style={{ margin: 0, fontSize: 16 }}>Activity History</h3>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <select className="form-select" style={{ width: 'auto', padding: '4px 12px', fontSize: 11 }} value={filterProjectId} onChange={e => setFilterProjectId(e.target.value)}>
                                    <option value="">ALL PROJECTS</option>
                                    {myProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <select className="form-select" style={{ width: 'auto', padding: '4px 12px', fontSize: 11 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                    <option value="">ALL STATUS</option>
                                    {['todo', 'in_progress', 'done', 'blocked', 'verified', 'failed'].map(s => (
                                        <option key={s} value={s}>{s.toUpperCase()}</option>
                                    ))}
                                    <option disabled>──────</option>
                                    <option value="completed">COMPLETED</option>
                                    <option value="audited">AUDITED</option>
                                    <option value="pending_qa">PENDING QA</option>
                                </select>
                            </div>
                        </div>
                        <DataTable
                            loading={loading}
                            data={filteredEntries}
                            columns={columns}
                            fileName={`my_timesheet_${startDate}`}
                        />
                    </div>
                </div>
            </div>

            {editingEntry && (
                <EditEntryModal
                    entry={editingEntry}
                    myProjects={myProjects}
                    onClose={() => setEditingEntry(null)}
                    onSaved={(updated) => {
                        setAllEntries(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e))
                    }}
                />
            )}

            <style>{`
                .employee-timesheet { padding: 8px; }
                .stat-card { padding: 20px; display: flex; alignItems: center; gap: 16px; background: var(--bg-card); border: 1px solid var(--border); }
                .stat-value { fontSize: 24px; fontWeight: 800; }
                .stat-label { fontSize: 11px; fontWeight: 700; color: var(--text-dim); textTransform: uppercase; }
                .stat-icon-circle { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .stat-icon-circle.purple { background: rgba(124, 58, 237, 0.1); color: var(--accent); }
                .stat-icon-circle.yellow { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
                .stat-icon-circle.green { background: rgba(34, 197, 94, 0.1); color: var(--success); }
                .badge-purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
                .form-select-badge {
                    width: 100%; border: none; background: transparent; color: inherit; 
                    font-size: 10px; fontWeight: 800; cursor: pointer; text-align: center;
                }
                .btn-danger-ghost:hover { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
            `}</style>
        </div>
    )
}
