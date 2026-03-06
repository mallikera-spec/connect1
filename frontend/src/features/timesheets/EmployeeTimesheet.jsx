import { useEffect, useState, useMemo } from 'react'
import { Plus, Trash2, Link2, Clock, Calendar, CheckCircle2, Filter, Zap, Target, TrendingUp, History, Edit } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import EditEntryModal from './EditEntryModal'

const STATUS_OPTS = ['todo', 'in_progress', 'done', 'blocked']
const STATUS_BADGE = {
    todo: 'badge-gray',
    in_progress: 'badge-yellow',
    done: 'badge-green',
    blocked: 'badge-red',
    verified: 'badge-purple',
    failed: 'badge-red'
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : ''
const todayISO = () => new Date().toISOString().slice(0, 10)

import DateRangePicker from '../../components/DateRangePicker'

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
    const [newTaskId, setNewTaskId] = useState('')
    const [newTitle, setNewTitle] = useState('')
    const [newTime, setNewTime] = useState('00:00')
    const [newNotes, setNewNotes] = useState('')
    const [newStatus, setNewStatus] = useState('done') // Default to done for quick logging
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
            setNewStatus('done')
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
            const res = await api.patch(`/timesheets/entries/${entryId}`, updates)
            const updated = res.data.data
            setAllEntries(prev => prev.map(e => e.id === entryId ? { ...e, ...updated } : e))
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSavingId(null)
        }
    }

    const handleExportCSV = () => {
        const entries = filteredEntries;
        if (entries.length === 0) return toast.error('No data to export');
        const headers = ['Date', 'Project', 'Activity', 'Hours', 'Status', 'QA Result', 'QA Notes', 'Admin Feedback'];
        const rows = entries.map(e => [
            e.date,
            e.project?.name || e.projectName || 'In-House Project',
            e.title,
            e.hours_spent,
            e.status,
            ['verified', 'failed'].includes(e.status) ? e.status.toUpperCase() : 'PENDING',
            (e.qa_notes || '').replace(/\n/g, ' '),
            (e.admin_feedback || '').replace(/\n/g, ' ')
        ]);
        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `timesheet_${startDate}_${endDate}.csv`);
        link.click();
    };

    const handleExportExcel = () => {
        const entries = filteredEntries;
        if (entries.length === 0) return toast.error('No data to export');
        const headers = ['Date', 'Project', 'Activity', 'Hours', 'Status', 'QA Result', 'QA Notes', 'Admin Feedback'];
        const rows = entries.map(e => [
            e.date,
            e.project?.name || e.projectName || 'In-House Project',
            e.title,
            e.hours_spent,
            e.status,
            ['verified', 'failed'].includes(e.status) ? e.status.toUpperCase() : 'PENDING',
            (e.qa_notes || '').replace(/\n/g, ' '),
            (e.admin_feedback || '').replace(/\n/g, ' ')
        ]);
        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `timesheet_${startDate}_${endDate}.xls`);
        link.click();
    };

    const handleExportPDF = () => {
        window.print();
    };

    const handleDelete = async (entryId) => {
        if (!confirm('Remove this activity?')) return
        try {
            await api.delete(`/timesheets/entries/${entryId}`)
            setAllEntries(prev => prev.filter(e => e.id !== entryId))
            toast.success('Activity removed')
        } catch (err) { toast.error(err.message) }
    }

    // Stats
    const stats = useMemo(() => {
        const todayEntries = allEntries.filter(e => e.date === todayISO())
        const totalMinutes = todayEntries.reduce((acc, e) => {
            const [h, m] = e.hours_spent.split(':').map(Number)
            return acc + (h * 60) + m
        }, 0)
        const totalHours = (totalMinutes / 60).toFixed(1)
        const completed = todayEntries.filter(e => e.status === 'done').length

        // Count non-completed tasks from report
        const pendingTasks = report?.tasks_by_status ? (report.tasks_by_status.pending + report.tasks_by_status.in_progress) : 0

        return { totalHours, count: todayEntries.length, completed, pendingTasks }
    }, [allEntries, report])

    const filteredEntries = useMemo(() => {
        return allEntries.filter(e => {
            if (filterProjectId && e.project_id !== filterProjectId) return false
            if (statusFilter && e.status !== statusFilter) return false
            return true
        })
    }, [allEntries, filterProjectId, statusFilter])

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <h1>Activity Hub</h1>
                    <p>Track your flow, conquer your day.</p>
                </div>
                <div className="header-actions">
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onRangeChange={(range) => {
                            setStartDate(range.startDate);
                            setEndDate(range.endDate);
                        }}
                    />
                </div>
            </div>

            {/* Stats Bar */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
                <div className="card shadow-sm" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="stat-icon-circle purple"><Clock size={20} /></div>
                    <div>
                        <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.totalHours}h</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Logged Today</div>
                    </div>
                </div>
                <div className="card shadow-sm" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="stat-icon-circle yellow"><CheckCircle2 size={20} /></div>
                    <div>
                        <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.pendingTasks}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Pending Tasks</div>
                    </div>
                </div>
                <div className="card shadow-sm" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="stat-icon-circle green"><Target size={20} /></div>
                    <div>
                        <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.completed}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Done Today</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
                {/* Left Column: Plan Activity */}
                <div className="grid-column">
                    <div className="card shadow-sm glass-card" style={{ padding: 24 }}>
                        <div className="section-title" style={{ marginBottom: 20 }}>
                            <TrendingUp size={18} style={{ color: 'var(--accent)' }} />
                            <h3 style={{ margin: 0, fontSize: 16 }}>Plan Activity</h3>
                        </div>
                        <form onSubmit={handleAddEntry} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label"><Calendar size={12} style={{ marginRight: 6 }} /> Date</label>
                                <input type="date" className="form-control" value={newDate} onChange={e => setNewDate(e.target.value)} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Project Scope</label>
                                <select className="form-select" value={newProjectId} onChange={e => setNewProjectId(e.target.value)}>
                                    <option value="">Select Scope...</option>
                                    {myProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Task Description</label>
                                <input className="form-control" placeholder="e.g. Building login screen" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label"><Clock size={12} style={{ marginRight: 6 }} /> Time (hh:mm)</label>
                                <input type="time" className="form-control" value={newTime} onChange={e => setNewTime(e.target.value)} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Initial Status</label>
                                <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                                    <option value="todo">To Do (Planned)</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="done">Done (Ready for QA)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea
                                    className="form-control"
                                    placeholder="Brief technical details..."
                                    value={newNotes}
                                    onChange={e => setNewNotes(e.target.value)}
                                    rows={3}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={adding || !newTitle.trim() || !newProjectId || !newNotes.trim() || !newTime || newTime === '00:00'}>
                                {adding ? <span className="spinner-sm" /> : <><Plus size={18} /> Log Activity</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: History */}
                <div className="grid-column">
                    <div className="card shadow-sm glass-card" style={{ padding: 0 }}>
                        <div className="card-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <History size={18} style={{ color: 'var(--accent)' }} />
                                <h3 style={{ margin: 0, fontSize: 16 }}>Activity History</h3>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <select className="form-select" style={{ width: 'auto', padding: '4px 12px', fontSize: 12 }} value={filterProjectId} onChange={e => setFilterProjectId(e.target.value)}>
                                    <option value="">ALL PROJECTS</option>
                                    {myProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <select className="form-select" style={{ width: 'auto', padding: '4px 12px', fontSize: 12 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                    <option value="">ALL STATUS</option>
                                    {['todo', 'in_progress', 'done', 'blocked', 'verified', 'failed'].map(s => (
                                        <option key={s} value={s}>{s.toUpperCase()}</option>
                                    ))}
                                </select>
                                <div className="btn-group">
                                    <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={handleExportCSV}>CSV</button>
                                    <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={handleExportExcel}>EXCEL</button>
                                    <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={handleExportPDF}>PDF</button>
                                </div>
                            </div>
                        </div>

                        <div className="table-wrapper" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
                            {loading ? (
                                <div className="page-loader" style={{ height: 200 }}><div className="spinner" /></div>
                            ) : filteredEntries.length === 0 ? (
                                <div className="empty-state-card" style={{ padding: 48 }}>
                                    <Calendar size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                                    <h3>No activities logged</h3>
                                    <p>Your history for this period is empty.</p>
                                </div>
                            ) : (
                                <table className="compact-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 100 }}>Date</th>
                                            <th style={{ width: 120 }}>Project</th>
                                            <th>Activity Details</th>
                                            <th style={{ width: 60 }}>Time</th>
                                            <th style={{ width: 120 }}>Status</th>
                                            <th style={{ width: 150 }}>QA Feedback</th>
                                            <th style={{ width: 180 }}>Admin Feedback</th>
                                            <th style={{ width: 80, textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEntries.map(e => (
                                            <tr key={e.id}>
                                                <td style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>{fmt(e.date)}</td>
                                                <td>
                                                    <span className="badge-pill badge-purple" style={{ fontSize: 9 }}>
                                                        {(e.project?.name || 'In-House').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{e.title}</div>
                                                    {e.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{e.notes}</div>}
                                                </td>
                                                <td style={{ fontWeight: 800, color: 'var(--accent)' }}>{e.hours_spent}</td>
                                                <td>
                                                    {['verified', 'failed'].includes(e.status) ? (
                                                        <span className={`badge-pill ${STATUS_BADGE[e.status]}`} style={{ width: '100%', textAlign: 'center' }}>
                                                            {e.status.toUpperCase()}
                                                        </span>
                                                    ) : (
                                                        <select
                                                            className={`form-select-badge ${STATUS_BADGE[e.status]}`}
                                                            value={e.status}
                                                            onChange={ev => handleUpdate(e.id, { status: ev.target.value })}
                                                            style={{ textTransform: 'uppercase', fontStyle: 'normal' }}
                                                        >
                                                            {STATUS_OPTS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                                        </select>
                                                    )}
                                                </td>
                                                <td style={{ fontSize: 11, color: e.status === 'verified' ? 'var(--text-muted)' : '#ef4444', fontWeight: 600 }}>
                                                    {e.qa_notes ? `🚩 ${e.qa_notes}` : <span style={{ opacity: 0.2 }}>—</span>}
                                                </td>
                                                <td style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                                                    {e.admin_feedback || <span style={{ opacity: 0.2 }}>—</span>}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                                        <button className="btn-icon-sm" onClick={() => setEditingEntry(e)}><Edit size={14} /></button>
                                                        {hasRole('super_admin') && (
                                                            <button className="btn-icon-sm danger" onClick={() => handleDelete(e.id)}><Trash2 size={14} /></button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
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
                .stat-icon-circle { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .stat-icon-circle.purple { background: rgba(124, 58, 237, 0.1); color: var(--accent); }
                .stat-icon-circle.yellow { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
                .stat-icon-circle.green { background: rgba(34, 197, 94, 0.1); color: var(--success); }
                
                .form-select-badge {
                    width: 100%;
                    padding: 4px 8px;
                    border-radius: 6px;
                    border: none;
                    background: var(--bg-card);
                    color: inherit;
                    font-size: 10px;
                    font-weight: 800;
                    cursor: pointer;
                    appearance: none;
                    text-align: center;
                }
                
                .btn-icon-sm.danger:hover { color: var(--danger); background: var(--danger-bg); }

                @media (max-width: 1024px) {
                    .dashboard-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div >
    )
}
