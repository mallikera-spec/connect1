import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, AlertCircle, Clock, Search, Filter, CheckCircle2, X, Users, Briefcase, ListTodo, Trash2 } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import DateRangePicker from '../../components/DateRangePicker'

const STATUS_BADGE = {
    pending: 'badge-gray',
    in_progress: 'badge-yellow',
    done: 'badge-purple',
    verified: 'badge-green',
    failed: 'badge-red'
}

const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

export default function TestingTasks() {
    const { hasRole } = useAuth()
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('done') // Default to 'Ready for Testing'

    const [allUsers, setAllUsers] = useState([])
    const [allProjects, setAllProjects] = useState([])
    const [selectedUserId, setSelectedUserId] = useState('')
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))

    const [modal, setModal] = useState(null)
    const [selectedTask, setSelectedTask] = useState(null)
    const [qaReport, setQaReport] = useState({ status: '', notes: '' })

    const loadUsers = async () => {
        try {
            const r = await api.get('/users', { params: { role: 'developer' } })
            setAllUsers(r.data.data)
        } catch (_) { }
    }

    const loadProjects = async () => {
        try {
            const r = await api.get('/projects')
            setAllProjects(r.data.data)
        } catch (_) { }
    }

    const loadTasks = async () => {
        setLoading(true)
        try {
            const params = { startDate, endDate }
            const res = await api.get('/tasks', { params })
            setTasks(res.data.data || [])
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUsers()
        loadProjects()
    }, [])

    const location = useLocation()
    useEffect(() => {
        if (location.state) {
            if (location.state.startDate) setStartDate(location.state.startDate)
            if (location.state.endDate) setEndDate(location.state.endDate)
            if (location.state.status) setFilterStatus(location.state.status)
            window.history.replaceState({}, document.title)
        }
    }, [location.state])

    useEffect(() => {
        loadTasks()
    }, [startDate, endDate])

    const filtered = useMemo(() => {
        return tasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.assignee?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())

            let matchesStatus = false
            if (filterStatus === 'all') matchesStatus = true
            else if (filterStatus === 'upcoming') matchesStatus = ['pending', 'in_progress'].includes(t.status)
            else matchesStatus = t.status === filterStatus

            const matchesUser = !selectedUserId || t.assignee?.id === selectedUserId
            const matchesProject = !selectedProjectId || t.project?.id === selectedProjectId

            return matchesSearch && matchesStatus && matchesUser && matchesProject
        })
    }, [tasks, searchTerm, filterStatus, selectedUserId, selectedProjectId])

    const openQaModal = (task, status) => {
        setSelectedTask(task)
        setQaReport({ status, notes: task.qa_notes || '' })
        setModal('qa_report')
    }

    const handleQaReport = async (e) => {
        e.preventDefault()
        if (!selectedTask) return

        setSavingId(selectedTask.id)
        try {
            const updates = {
                status: qaReport.status,
                qa_notes: qaReport.notes
            }
            await api.patch(`/tasks/${selectedTask.id}`, updates)
            setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, ...updates } : t))
            toast.success(`Task marked as ${qaReport.status.toUpperCase()}`)
            setModal(null)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSavingId(null)
        }
    }

    const handleDeleteTask = async (id) => {
        if (!confirm('Are you sure you want to delete this task?')) return
        try {
            await api.delete(`/tasks/${id}`)
            setTasks(prev => prev.filter(t => t.id !== id))
            toast.success('Task deleted successfully')
        } catch (err) {
            toast.error(err.message)
        }
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <h1>Testing Tasks</h1>
                    <p>Review and verify project deliverables</p>
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

            <div className="card shadow-sm" style={{ marginBottom: 24, padding: '24px' }}>
                <div className="filter-grid">
                    <div className="form-group">
                        <label className="form-label"><Search size={12} style={{ marginRight: 6 }} /> Search</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Task or Developer..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label"><Users size={12} style={{ marginRight: 6 }} /> Developer</label>
                        <select className="form-select" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                            <option value="">All Developers</option>
                            {allUsers.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label"><Briefcase size={12} style={{ marginRight: 6 }} /> Project</label>
                        <select className="form-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                            <option value="">All Projects</option>
                            {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="status-filter-row" style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <div className="status-tabs">
                        <button className={`tab ${filterStatus === 'done' ? 'active' : ''}`} onClick={() => setFilterStatus('done')}>
                            Ready ({tasks.filter(t => t.status === 'done').length})
                        </button>
                        <button className={`tab ${filterStatus === 'upcoming' ? 'active' : ''}`} onClick={() => setFilterStatus('upcoming')}>
                            Upcoming ({tasks.filter(t => ['pending', 'in_progress'].includes(t.status)).length})
                        </button>
                        <button className={`tab ${filterStatus === 'verified' ? 'active' : ''}`} onClick={() => setFilterStatus('verified')}>
                            Verified
                        </button>
                        <button className={`tab ${filterStatus === 'failed' ? 'active' : ''}`} onClick={() => setFilterStatus('failed')}>
                            Failed (Bugs)
                        </button>
                    </div>
                </div>
            </div>

            <div className="table-wrapper shadow-sm">
                {loading ? (
                    <div className="page-loader" style={{ height: 200 }}><div className="spinner" /></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state-card">
                        <ListTodo size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                        <h3>Inbox is clear!</h3>
                        <p>No tasks found for this view.</p>
                    </div>
                ) : (
                    <table className="compact-table">
                        <thead>
                            <tr>
                                <th style={{ width: 100 }}>Created</th>
                                <th style={{ width: 130 }}>Assignee</th>
                                <th style={{ width: 120 }}>Project</th>
                                <th>Task Details</th>
                                <th style={{ width: 60 }}>Pri</th>
                                <th style={{ width: 100 }}>Status</th>
                                <th style={{ width: 90, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(t => (
                                <tr key={t.id} onClick={() => openQaModal(t, t.status === 'done' ? 'verified' : t.status)} className="clickable-row">
                                    <td style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{fmt(t.created_at)}</td>
                                    <td style={{ fontSize: 13, fontWeight: 600 }}>{t.assignee?.full_name || 'Unassigned'}</td>
                                    <td>
                                        <span className="badge-pill badge-purple" style={{ fontSize: 9 }}>
                                            {(t.project?.name || 'Unknown').toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="todo-cell">
                                            <span style={{ fontWeight: 600 }}>{t.title}</span>
                                            {t.qa_notes && (
                                                <span className="qa-flag" style={{
                                                    color: t.status === 'verified' ? 'var(--text-muted)' : '#ef4444',
                                                    background: t.status === 'verified' ? 'rgba(255,255,255,0.05)' : 'rgba(239, 68, 68, 0.08)'
                                                }}>
                                                    🚩 {t.qa_notes.slice(0, 35)}...
                                                </span>
                                            )}
                                            {t.developer_reply && (
                                                <span className="qa-flag" style={{
                                                    color: 'var(--accent)',
                                                    background: 'rgba(59, 130, 246, 0.05)',
                                                    marginTop: 4
                                                }}>
                                                    💬 {t.developer_reply.slice(0, 35)}...
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td><span className={`badge-pill badge-${t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'yellow' : 'blue'}`} style={{ fontSize: 9 }}>{t.priority.toUpperCase()}</span></td>
                                    <td>
                                        <span className={`badge-pill ${STATUS_BADGE[t.status]}`} style={{ fontSize: 9 }}>
                                            {t.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {t.status === 'done' ? (
                                            <div className="quick-actions">
                                                <button className="btn-icon-sm pass" onClick={(e) => { e.stopPropagation(); openQaModal(t, 'verified'); }}><ShieldCheck size={16} /></button>
                                                <button className="btn-icon-sm fail" onClick={(e) => { e.stopPropagation(); openQaModal(t, 'failed'); }}><AlertCircle size={16} /></button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                <button className="btn-icon-sm" onClick={(e) => { e.stopPropagation(); openQaModal(t, t.status); }} title="Details"><Search size={16} /></button>
                                                {hasRole('super_admin') && (
                                                    <button className="btn-icon-sm danger" onClick={(e) => { e.stopPropagation(); handleDeleteTask(t.id); }} title="Delete Task"><Trash2 size={16} /></button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modal === 'qa_report' && selectedTask && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
                    <div className="modal modal-lg">
                        <div className="modal-header">
                            <h2 className="modal-title">Task Verification</h2>
                            <button className="btn-icon" onClick={() => setModal(null)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleQaReport}>
                            <div className="modal-body split-body">
                                <div className="detail-panel">
                                    <h4 className="modal-subtitle">Context</h4>
                                    <div className="data-grid">
                                        <div className="data-item"><label>Developer</label><p>{selectedTask.assignee?.full_name}</p></div>
                                        <div className="data-item"><label>Project</label><p>{selectedTask.project?.name}</p></div>
                                        <div className="data-item"><label>Priority</label><p style={{ textTransform: 'capitalize' }}>{selectedTask.priority}</p></div>
                                        <div className="data-item"><label>Est Hours</label><p>{selectedTask.estimated_hours || '—'}</p></div>
                                    </div>
                                    <div className="data-item full">
                                        <p className="emphasis-text">{selectedTask.title}</p>
                                    </div>
                                    {selectedTask.developer_reply && (
                                        <div className="data-item full" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: 12, borderRadius: 8, marginTop: 12 }}>
                                            <label style={{ color: 'var(--accent)' }}>Developer's Reply</label>
                                            <p style={{ fontSize: 13, margin: 0 }}>{selectedTask.developer_reply}</p>
                                        </div>
                                    )}
                                    {selectedTask.description && (
                                        <div className="data-item full">
                                            <label>Description</label>
                                            <div className="text-quote">{selectedTask.description}</div>
                                        </div>
                                    )}
                                </div>
                                <div className="action-panel">
                                    <h4 className="modal-subtitle">Assessment</h4>
                                    <div className="decision-toggle">
                                        <button type="button" className={`toggle-option pass ${qaReport.status === 'verified' ? 'active' : ''}`} onClick={() => setQaReport(p => ({ ...p, status: 'verified' }))}>
                                            <ShieldCheck size={18} /> PASSED
                                        </button>
                                        <button type="button" className={`toggle-option fail ${qaReport.status === 'failed' ? 'active' : ''}`} onClick={() => setQaReport(p => ({ ...p, status: 'failed' }))}>
                                            <AlertCircle size={18} /> FAILED
                                        </button>
                                    </div>
                                    <div className="form-group" style={{ marginTop: 24 }}>
                                        <label className="form-label">QA Notes / Feedback</label>
                                        <textarea
                                            className="form-textarea"
                                            rows={8}
                                            value={qaReport.notes}
                                            onChange={e => setQaReport(p => ({ ...p, notes: e.target.value }))}
                                            placeholder={qaReport.status === 'verified' ? "Optional notes..." : "Why did it fail?"}
                                            required={qaReport.status === 'failed'}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                                <button type="submit" className={`btn ${qaReport.status === 'verified' ? 'btn-success' : 'btn-danger'}`} style={{ fontWeight: 800 }} disabled={savingId === selectedTask.id}>
                                    {savingId === selectedTask.id ? 'Saving...' : `CONFIRM ${qaReport.status === 'verified' ? 'PASS' : 'FAIL'}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
                .status-tabs { display: flex; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 10px; border: 1px solid var(--border); }
                .tab { padding: 6px 14px; border-radius: 7px; border: none; background: transparent; color: var(--text-dim); font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
                .tab.active { background: var(--accent); color: white; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); }
                .tab:hover { color: var(--text); }
                .compact-table { width: 100%; border-collapse: collapse; }
                .compact-table th { padding: 12px 16px; border-bottom: 2px solid var(--border); background: rgba(255,255,255,0.01); }
                .compact-table td { padding: 10px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
                .clickable-row { cursor: pointer; transition: background 0.2s; }
                .clickable-row:hover { background: var(--bg-card-hover); }
                .todo-cell { display: flex; flex-direction: column; gap: 2px; }
                .qa-flag { font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; width: fit-content; margin-top: 4px; }
                .quick-actions { display: flex; gap: 6px; justify-content: flex-end; }
                .btn-icon-sm { width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; background: transparent; color: var(--text-muted); cursor: pointer; }
                .btn-icon-sm.pass:hover { background: #22c55e; color: white; border-color: #22c55e; }
                .btn-icon-sm.fail:hover { background: #ef4444; color: white; border-color: #ef4444; }
                .btn-icon-sm:hover:not(.pass):not(.fail) { background: var(--accent); color: white; border-color: var(--accent); }
                .split-body { display: grid; grid-template-columns: 1fr 1fr; gap: 0; padding: 0 !important; }
                .detail-panel { padding: 32px; border-right: 1px solid var(--border); background: rgba(0,0,0,0.1); }
                .action-panel { padding: 32px; background: var(--bg); }
                .modal-subtitle { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--accent-light); margin-bottom: 24px; letter-spacing: 0.1em; border-left: 3px solid var(--accent); padding-left: 12px; }
                .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
                .data-item label { display: block; font-size: 10px; color: var(--text-dim); font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
                .data-item p { margin: 0; font-weight: 600; color: var(--text); font-size: 14px; }
                .data-item.full { grid-column: 1 / -1; margin-top: 12px; }
                .emphasis-text { font-size: 18px !important; font-weight: 800 !important; color: var(--accent-light) !important; line-height: 1.4; }
                .text-quote { background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 16px; border-radius: 10px; font-size: 13px; line-height: 1.6; color: var(--text-muted); font-style: italic; }
                .decision-toggle { display: flex; gap: 12px; }
                .toggle-option { flex: 1; height: 50px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-dim); font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: all 0.2s; }
                .toggle-option.pass.active { background: #22c55e; color: white; border-color: #22c55e; box-shadow: 0 8px 16px rgba(34, 197, 94, 0.2); }
                .toggle-option.fail.active { background: #ef4444; color: white; border-color: #ef4444; box-shadow: 0 8px 16px rgba(239, 68, 68, 0.2); }
            `}</style>
        </div>
    )
}
