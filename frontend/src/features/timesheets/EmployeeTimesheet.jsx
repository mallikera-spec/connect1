import { useEffect, useState, useMemo } from 'react'
import { Plus, Trash2, Link2, Clock, Calendar, CheckCircle2, Filter, Zap, Target, TrendingUp, History } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const STATUS_OPTS = ['todo', 'in_progress', 'done', 'blocked']
const STATUS_BADGE = { todo: 'badge-gray', in_progress: 'badge-yellow', done: 'badge-green', blocked: 'badge-red' }

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : ''
const todayISO = () => new Date().toISOString().slice(0, 10)

export default function EmployeeTimesheet() {
    const { user } = useAuth()

    const [startDate, setStartDate] = useState(todayISO())
    const [endDate, setEndDate] = useState(todayISO())
    const [allEntries, setAllEntries] = useState([])
    const [myProjects, setMyProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState(null)
    const [report, setReport] = useState(null)
    const [filterProjectId, setFilterProjectId] = useState('')

    // Form for new entry
    const [newDate, setNewDate] = useState(todayISO())
    const [newProjectId, setNewProjectId] = useState('')
    const [newTaskId, setNewTaskId] = useState('')
    const [newTitle, setNewTitle] = useState('')
    const [newTime, setNewTime] = useState('00:00')
    const [newNotes, setNewNotes] = useState('')
    const [adding, setAdding] = useState(false)

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
        if (!newTitle.trim() || !newProjectId || !newNotes.trim()) {
            return toast.error('Please fill all fields: Project, Activity, and Notes are mandatory.')
        }
        setAdding(true)
        try {
            const tsRes = await api.get('/timesheets/me', { params: { date: newDate } })
            const tsId = tsRes.data.data.id

            const payload = {
                title: newTitle.trim(),
                status: 'todo',
                hours_spent: newTime,
                notes: newNotes,
                project_id: newProjectId || null
            }
            await api.post(`/timesheets/${tsId}/entries`, payload)

            setNewTitle('')
            setNewTime('00:00')
            setNewNotes('')
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
        const headers = ['Date', 'Project', 'Activity', 'Hours', 'Status', 'Notes'];
        const rows = entries.map(e => [
            e.date,
            e.project?.name || e.projectName || 'In-House Project',
            e.title,
            e.hours_spent,
            e.status,
            (e.notes || '').replace(/\n/g, ' ')
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
        const headers = ['Date', 'Project', 'Activity', 'Hours', 'Status', 'Notes'];
        const rows = entries.map(e => [
            e.date,
            e.project?.name || e.projectName || 'In-House Project',
            e.title,
            e.hours_spent,
            e.status,
            (e.notes || '').replace(/\n/g, ' ')
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
            return true
        })
    }, [allEntries, filterProjectId])

    return (
        <div className="dev-dashboard">
            {/* Header with Glassmorphism Effect */}
            <div className="dashboard-header card">
                <div className="header-info">
                    <h1>Activity Hub</h1>
                    <p>Track your flow, conquer your day.</p>
                </div>
                <div className="header-stats">
                    <div className="quick-stat">
                        <div className="stat-icon purple"><Clock size={20} /></div>
                        <div>
                            <div className="stat-val">{stats.totalHours}h</div>
                            <div className="stat-label">Logged</div>
                        </div>
                    </div>
                    <div className="quick-stat">
                        <div className="stat-icon yellow"><CheckCircle2 size={20} /></div>
                        <div>
                            <div className="stat-val">{stats.pendingTasks}</div>
                            <div className="stat-label">Pending Tasks</div>
                        </div>
                    </div>
                    <div className="quick-stat">
                        <div className="stat-icon green"><Target size={20} /></div>
                        <div>
                            <div className="stat-val" style={{ fontWeight: 900, fontSize: '24px' }}>{stats.completed}</div>
                            <div className="stat-label" style={{ fontWeight: 700 }}>Done Today</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Left Column: Quick Plan */}
                <div className="grid-column">
                    <div className="card shadow-md glass-card">
                        <div className="card-header-premium">
                            <TrendingUp size={18} />
                            <h3>Plan Your Activity</h3>
                        </div>
                        <form onSubmit={handleAddEntry} className="premium-form">
                            <div className="form-group-compact">
                                <label><Calendar size={12} /> Date</label>
                                <input type="date" className="glass-input" value={newDate} onChange={e => setNewDate(e.target.value)} required />
                            </div>

                            <div className="form-group-compact">
                                <label>Project</label>
                                <select className="glass-select" value={newProjectId} onChange={e => setNewProjectId(e.target.value)}>
                                    <option value="">Select Scope...</option>
                                    {myProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div className="form-group-compact">
                                <label>What are you working on?</label>
                                <input className="glass-input" placeholder="e.g. Building login screen" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
                            </div>


                            <div className="form-group-compact">
                                <label><Clock size={12} required /> Time Commitment (hh:mm)</label>
                                <input type="time" className="glass-input" value={newTime} onChange={e => setNewTime(e.target.value)} required />
                            </div>

                            <div className="form-group-compact">
                                <label>Notes</label>
                                <textarea
                                    className="glass-textarea"
                                    placeholder="Brief details..."
                                    value={newNotes}
                                    onChange={e => setNewNotes(e.target.value)}
                                    rows={2}
                                    required
                                />
                            </div>

                            <button type="submit" className="premium-btn" disabled={adding || !newTitle.trim() || !newProjectId || !newNotes.trim()}>
                                {adding ? <span className="spinner" /> : <><Plus size={18} /> Plan Activity</>}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="grid-column wider">
                    <div className="section-title">
                        <History size={18} />
                        <h2>Activity History</h2>
                    </div>

                    <div className="filter-panel card shadow-sm glass-card" style={{ marginBottom: 20, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div className="filter-group">
                            <label style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>PROJECT</label>
                            <select className="glass-select-sm" value={filterProjectId} onChange={e => setFilterProjectId(e.target.value)}>
                                <option value="">ALL PROJECTS</option>
                                {myProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>DATE RANGE</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input type="date" className="glass-input-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                <span style={{ fontSize: 12, fontWeight: 800 }}>TO</span>
                                <input type="date" className="glass-input-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>
                        <div className="export-btns" style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                            <button className="export-btn csv" onClick={handleExportCSV}>CSV</button>
                            <button className="export-btn excel" onClick={handleExportExcel}>EXCEL</button>
                            <button className="export-btn pdf" onClick={handleExportPDF}>PDF</button>
                        </div>
                    </div>

                    <div className="activity-table-container card shadow-sm glass-card">
                        {loading ? <div className="page-loader"><div className="spinner" /></div> : (
                            allEntries.length === 0 ? (
                                <div className="empty-state-card">
                                    <Calendar size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                                    <h3>No activities logged yet</h3>
                                    <p>Start by planning your first activity today.</p>
                                </div>
                            ) : (
                                <table className="activity-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Project</th>
                                            <th>Activity</th>
                                            <th>Time</th>
                                            <th>Status</th>
                                            <th>Notes</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEntries.map(e => (
                                            <tr key={e.id}>
                                                <td className="col-date">{fmt(e.date)}</td>
                                                <td className="col-project">
                                                    <select
                                                        className="inline-select"
                                                        value={e.project_id || ''}
                                                        onChange={ev => handleUpdate(e.id, { project_id: ev.target.value })}
                                                    >
                                                        <option value="">None</option>
                                                        {myProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="col-title">
                                                    <input
                                                        className="inline-input-bold"
                                                        defaultValue={e.title}
                                                        onBlur={ev => handleUpdate(e.id, { title: ev.target.value })}
                                                    />
                                                </td>
                                                <td className="col-time">
                                                    <input
                                                        type="text"
                                                        className="inline-time-input"
                                                        defaultValue={e.hours_spent}
                                                        onBlur={ev => handleUpdate(e.id, { hours_spent: ev.target.value })}
                                                    />
                                                </td>
                                                <td className="col-status">
                                                    <select
                                                        className={`status-select-badge ${STATUS_BADGE[e.status]}`}
                                                        value={e.status}
                                                        onChange={ev => handleUpdate(e.id, { status: ev.target.value })}
                                                    >
                                                        {STATUS_OPTS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                                    </select>
                                                </td>
                                                <td className="col-notes">
                                                    <textarea
                                                        className="inline-notes-table"
                                                        defaultValue={e.notes || ''}
                                                        onBlur={ev => handleUpdate(e.id, { notes: ev.target.value })}
                                                    />
                                                </td>
                                                <td className="col-actions">
                                                    <button className="delete-btn-minimal" onClick={() => handleDelete(e.id)}><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}
                    </div>
                    {/* This closing div was likely intended for the <td> or <tr>, but was misplaced. */}
                    {/* {savingId === e.id && <div className="spinner-sm mini" />} */}
                </div>
            </div>

            <style>{`
                .dev-dashboard { max-width: 1400px; margin: 0 auto; color: var(--text); }
                
                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 32px;
                    margin-bottom: 32px;
                    background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
                    border: 1px solid var(--border);
                    border-radius: 20px;
                    backdrop-filter: blur(12px);
                }
                
                .header-info h1 { 
                    font-size: 32px; 
                    font-weight: 800; 
                    margin-bottom: 8px; 
                    letter-spacing: -1px; 
                    background: var(--accent-gradient); 
                    -webkit-background-clip: text; 
                    -webkit-text-fill-color: transparent; 
                }
                .header-info p { color: var(--text-muted); font-size: 16px; }
                
                .header-stats { display: flex; gap: 32px; }
                .quick-stat { display: flex; align-items: center; gap: 12px; }
                .stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--bg-card); }
                .stat-icon.purple { color: var(--accent-light); background: rgba(124, 58, 237, 0.15); }
                .stat-icon.yellow { color: var(--warning); background: var(--warning-bg); }
                .stat-icon.green { color: var(--success); background: var(--success-bg); }
                .stat-val { font-size: 20px; font-weight: 700; line-height: 1.2; }
                .stat-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }

                .dashboard-grid { display: grid; grid-template-columns: 380px 1fr; gap: 32px; }
                .grid-column { display: flex; flex-direction: column; gap: 24px; }
                
                .glass-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; backdrop-filter: blur(10px); }
                .card-header-premium { padding: 20px 24px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--border); background: rgba(255, 255, 255, 0.02); }
                .card-header-premium h3 { margin: 0; font-size: 15px; font-weight: 600; color: var(--text); }
                
                .premium-form { padding: 24px; display: flex; flex-direction: column; gap: 18px; }
                .form-group-compact { display: flex; flex-direction: column; gap: 6px; }
                .form-group-compact label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-dim); display: flex; align-items: center; gap: 6px; }
                
                .glass-input, .glass-select, .glass-textarea { 
                    background: rgba(255, 255, 255, 0.03); 
                    border: 1px solid var(--border); 
                    border-radius: 10px; 
                    padding: 10px 14px; 
                    color: var(--text); 
                    font-size: 14px; 
                    transition: all 0.2s; 
                    font-family: inherit;
                }
                .glass-input:focus, .glass-select:focus, .glass-textarea:focus { border-color: var(--accent); outline: none; background: rgba(255, 255, 255, 0.06); box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1); }
                .glass-select option { background: #12102a; color: var(--text); }
                
                .premium-btn { 
                    background: var(--accent-gradient); 
                    color: #fff; 
                    border: none; 
                    padding: 14px; 
                    border-radius: 10px; 
                    font-weight: 600; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    gap: 8px; 
                    cursor: pointer; 
                    transition: all 0.2s; 
                    margin-top: 8px;
                    box-shadow: 0 4px 15px rgba(124, 58, 237, 0.2);
                }
                .premium-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 6px 20px rgba(124, 58, 237, 0.35); }
                .premium-btn:active:not(:disabled) { transform: translateY(0); }
                .premium-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .section-title { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
                .section-title h2 { margin: 0; font-size: 18px; font-weight: 700; color: var(--text); }
                .date-filters { margin-left: auto; display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text-muted); }
                .date-filters input { background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: 6px 10px; font-size: 12px; outline: none; transition: border-color 0.2s; }
                .date-filters input:focus { border-color: var(--accent); }

                .activity-table th { padding: 12px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-dim); border-bottom: 2px solid var(--border); text-align: left; letter-spacing: 0.1em; }
                .activity-table td { padding: 8px 14px; border-bottom: 1px solid var(--border); font-size: 13px; font-weight: 800; vertical-align: middle; }
                
                .inline-input-bold, .inline-select, .inline-time-input, .inline-notes-table {
                    background: transparent;
                    border: 1px solid transparent;
                    color: var(--text);
                    font-weight: 800;
                    padding: 4px 8px;
                    border-radius: 4px;
                    width: 100%;
                    font-family: inherit;
                    font-size: 13px;
                    transition: all 0.2s;
                }
                .inline-input-bold:hover, .inline-select:hover, .inline-time-input:hover, .inline-notes-table:hover {
                    background: rgba(255, 255, 255, 0.04);
                    border-color: var(--border);
                }
                .inline-input-bold:focus, .inline-select:focus, .inline-time-input:focus, .inline-notes-table:focus {
                    background: rgba(124, 58, 237, 0.1);
                    border-color: var(--accent);
                    outline: none;
                }
                
                .inline-notes-table { font-size: 12px; font-weight: 600; min-height: 24px; resize: vertical; }
                .inline-time-input { width: 60px; text-align: center; }
                
                .glass-input-sm, .glass-select-sm {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    padding: 6px 10px;
                    color: var(--text);
                    font-size: 12px;
                    font-weight: 700;
                    outline: none;
                }
                
                .export-btn {
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 800;
                    cursor: pointer;
                    border: 1px solid var(--border);
                    background: var(--bg-card);
                    color: var(--text);
                    transition: all 0.2s;
                }
                .export-btn:hover { background: var(--accent); color: white; border-color: var(--accent); }
                .export-btn.excel { background: rgba(34, 197, 94, 0.1); color: #22c55e; border-color: rgba(34, 197, 94, 0.2); }
                .export-btn.excel:hover { background: #22c55e; color: white; }

                .status-select-badge {
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 900;
                    cursor: pointer;
                    border: none;
                    text-transform: uppercase;
                }

                .empty-state-card { padding: 60px 40px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-dim); }
                .empty-state-card h3 { color: var(--text-muted); margin-bottom: 8px; }

                @media (max-width: 1100px) {
                    .dashboard-grid { grid-template-columns: 1fr; }
                    .grid-column.wider { order: 1; }
                    .grid-column:not(.wider) { order: 2; }
                }

                @media (max-width: 600px) {
                    .dashboard-header { flex-direction: column; align-items: flex-start; gap: 24px; padding: 24px; }
                    .header-stats { width: 100%; justify-content: space-between; gap: 12px; }
                    .quick-stat { flex-direction: column; align-items: center; text-align: center; }
                }
            `}</style>
        </div >
    )
}
