import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, AlertCircle, Clock, Search, Filter, CheckCircle2, X, Users, Briefcase, Download, FileText } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import DateRangePicker from '../../components/DateRangePicker'

const STATUS_BADGE = {
    todo: 'badge-gray',
    in_progress: 'badge-yellow',
    done: 'badge-purple',
    verified: 'badge-green',
    failed: 'badge-red'
}

const fmt = (d) => {
    if (!d) return ''
    // If it's a plain date (YYYY-MM-DD), parse as local time to avoid UTC midnight shift
    const date = d.length === 10 ? new Date(d + 'T00:00:00') : new Date(d)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}


export default function TestingQueue() {
    const { hasRole } = useAuth()
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('done') // Default to pending review

    // Advanced Filters
    const [allUsers, setAllUsers] = useState([])
    const [allProjects, setAllProjects] = useState([])
    const [selectedUserId, setSelectedUserId] = useState('')
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))

    // QA Modal state
    const [modal, setModal] = useState(null)
    const [selectedEntry, setSelectedEntry] = useState(null)
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

    const loadEntries = async () => {
        setLoading(true)
        try {
            const res = await api.get('/timesheets', { params: { startDate, endDate } })
            const allTs = res.data.data

            const flattened = allTs.flatMap(ts =>
                (ts.entries || []).map(e => ({
                    ...e,
                    userName: ts.user?.full_name,
                    userId: ts.user?.id,
                    project_id: e.project_id || e.task?.project_id,
                    date: ts.work_date
                }))
            ).filter(e => ['todo', 'in_progress', 'done', 'verified', 'failed'].includes(e.status))

            setEntries(flattened.sort((a, b) => new Date(b.date) - new Date(a.date)))
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
            if (location.state.statusFilter) setFilterStatus(location.state.statusFilter)
            // Clear to avoid sticky filters
            window.history.replaceState({}, document.title)
        }
    }, [location.state])

    useEffect(() => {
        loadEntries()
    }, [startDate, endDate])

    const filtered = useMemo(() => {
        return entries.filter(e => {
            const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.userName.toLowerCase().includes(searchTerm.toLowerCase())

            let matchesStatus = false
            if (filterStatus === 'all') matchesStatus = true
            else if (filterStatus === 'upcoming') matchesStatus = ['todo', 'in_progress'].includes(e.status)
            else matchesStatus = e.status === filterStatus

            const matchesUser = !selectedUserId || e.userId === selectedUserId
            const matchesProject = !selectedProjectId || e.project_id === selectedProjectId

            return matchesSearch && matchesStatus && matchesUser && matchesProject
        })
    }, [entries, searchTerm, filterStatus, selectedUserId, selectedProjectId])

    const openQaModal = (entry, status) => {
        setSelectedEntry(entry)
        setQaReport({ status, notes: entry.qa_notes || '' })
        setModal('qa_report')
    }

    const handleQaReport = async (e) => {
        e.preventDefault()
        if (!selectedEntry) return

        setSavingId(selectedEntry.id)
        try {
            const updates = {
                status: qaReport.status,
                qa_notes: qaReport.notes
            }
            await api.patch(`/timesheets/entries/${selectedEntry.id}`, updates)

            setEntries(prev => prev.map(e => e.id === selectedEntry.id ? { ...e, ...updates } : e))
            toast.success(`Activity marked as ${qaReport.status.toUpperCase()}`)
            setModal(null)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSavingId(null)
        }
    }

    const handleExportCSV = () => {
        if (!filtered.length) return
        const headers = ['Date', 'Developer', 'Project', 'Title', 'Hours', 'Status']
        const rows = filtered.map(e => [
            e.date ? new Date(e.date + 'T00:00:00').toLocaleDateString() : '',
            `"${e.userName || ''}"`,
            `"${e.project?.name || 'In-House'}"`,
            `"${e.title || ''}"`,
            e.hours_spent || '',
            e.status || ''
        ])
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
        const link = document.createElement('a')
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
        link.download = `testing_queue_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }

    const handleExportPDF = () => window.print()

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <h1>Testing Todos</h1>
                    <p>Review and verify developer todo items</p>
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
                    <button className="btn btn-outline btn-sm" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Download size={14} /> CSV</button>
                    <button className="btn btn-outline btn-sm" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={14} /> PDF</button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            <div className="card shadow-sm" style={{ marginBottom: 24, padding: '24px' }}>
                <div className="filter-grid">
                    <div className="form-group">
                        <label className="form-label"><Search size={12} style={{ marginRight: 6 }} /> Search</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Todo or Developer..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label"><Users size={12} style={{ marginRight: 6 }} /> Developer</label>
                        <select
                            className="form-select"
                            value={selectedUserId}
                            onChange={e => setSelectedUserId(e.target.value)}
                        >
                            <option value="">All Developers</option>
                            {allUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label"><Briefcase size={12} style={{ marginRight: 6 }} /> Project</label>
                        <select
                            className="form-select"
                            value={selectedProjectId}
                            onChange={e => setSelectedProjectId(e.target.value)}
                        >
                            <option value="">All Projects</option>
                            {allProjects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="status-filter-row" style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <div className="status-tabs">
                        <button
                            className={`tab ${filterStatus === 'done' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('done')}
                        >
                            Ready ({entries.filter(e => e.status === 'done').length})
                        </button>
                        <button
                            className={`tab ${filterStatus === 'upcoming' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('upcoming')}
                        >
                            Upcoming ({entries.filter(e => ['todo', 'in_progress'].includes(e.status)).length})
                        </button>
                        <button
                            className={`tab ${filterStatus === 'verified' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('verified')}
                        >
                            Verified
                        </button>
                        <button
                            className={`tab ${filterStatus === 'failed' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('failed')}
                        >
                            Failed
                        </button>
                    </div>
                </div>
            </div>

            {/* Table View */}
            <div className="table-wrapper shadow-sm">
                {loading ? (
                    <div className="page-loader" style={{ height: 200 }}><div className="spinner" /></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state-card">
                        <CheckCircle2 size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                        <h3>Inbox is clear!</h3>
                        <p>No verification tasks found.</p>
                    </div>
                ) : (
                    <table className="compact-table">
                        <thead>
                            <tr>
                                <th style={{ width: 100 }}>Date</th>
                                <th style={{ width: 130 }}>Developer</th>
                                <th style={{ width: 120 }}>Project</th>
                                <th>Todo Details</th>
                                <th style={{ width: 60 }}>Hrs</th>
                                <th style={{ width: 100 }}>Status</th>
                                <th style={{ width: 90, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(entry => (
                                <tr key={entry.id} onClick={() => openQaModal(entry, entry.status === 'done' ? 'verified' : entry.status)} className="clickable-row">
                                    <td style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{fmt(entry.date)}</td>
                                    <td style={{ fontSize: 13, fontWeight: 600 }}>{entry.userName}</td>
                                    <td>
                                        <span className="badge-pill badge-purple" style={{ fontSize: 9 }}>
                                            {(entry.project?.name || 'In-House').toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="todo-cell">
                                            <span style={{ fontWeight: 600 }}>{entry.title}</span>
                                            {entry.qa_notes && (
                                                <span
                                                    className="qa-flag"
                                                    style={{
                                                        color: entry.status === 'verified' ? 'var(--text-muted)' : '#ef4444',
                                                        background: entry.status === 'verified' ? 'rgba(255,255,255,0.05)' : 'rgba(239, 68, 68, 0.08)'
                                                    }}
                                                >
                                                    🚩 {entry.qa_notes.slice(0, 35)}...
                                                </span>
                                            )}
                                            {entry.developer_reply && (
                                                <span className="qa-flag" style={{
                                                    color: 'var(--accent)',
                                                    background: 'rgba(59, 130, 246, 0.05)',
                                                    marginTop: 4
                                                }}>
                                                    💬 {entry.developer_reply.slice(0, 35)}...
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 800, color: 'var(--accent)' }}>{entry.hours_spent}</td>
                                    <td>
                                        <span className={`badge-pill ${STATUS_BADGE[entry.status]}`} style={{ fontSize: 9 }}>
                                            {entry.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {entry.status === 'done' ? (
                                            <div className="quick-actions">
                                                <button className="btn-icon-sm pass" onClick={(e) => { e.stopPropagation(); openQaModal(entry, 'verified'); }}><ShieldCheck size={16} /></button>
                                                <button className="btn-icon-sm fail" onClick={(e) => { e.stopPropagation(); openQaModal(entry, 'failed'); }}><AlertCircle size={16} /></button>
                                            </div>
                                        ) : (
                                            <button className="btn-icon-sm" onClick={(e) => { e.stopPropagation(); openQaModal(entry, entry.status); }}><Search size={16} /></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* QA Report Modal */}
            {modal === 'qa_report' && selectedEntry && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
                    <div className="modal modal-lg">
                        <div className="modal-header">
                            <h2 className="modal-title">Verification Report</h2>
                            <button className="btn-icon" onClick={() => setModal(null)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleQaReport}>
                            <div className="modal-body split-body">
                                <div className="detail-panel">
                                    <h4 className="modal-subtitle">Context</h4>
                                    <div className="data-grid">
                                        <div className="data-item">
                                            <label>Developer</label>
                                            <p>{selectedEntry.userName}</p>
                                        </div>
                                        <div className="data-item">
                                            <label>Project</label>
                                            <p>{selectedEntry.project?.name || 'In-House'}</p>
                                        </div>
                                        <div className="data-item">
                                            <label>Date</label>
                                            <p>{fmt(selectedEntry.date)}</p>
                                        </div>
                                        <div className="data-item">
                                            <label>Time Logged</label>
                                            <p>{selectedEntry.hours_spent} hrs</p>
                                        </div>
                                    </div>
                                    <div className="data-item full">
                                        <p className="emphasis-text">{selectedEntry.title}</p>
                                    </div>
                                    {selectedEntry.developer_reply && (
                                        <div className="data-item full" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: 12, borderRadius: 8, marginTop: 8 }}>
                                            <label style={{ color: 'var(--accent)' }}>Developer's Reply</label>
                                            <p style={{ fontSize: 13, margin: 0 }}>{selectedEntry.developer_reply}</p>
                                        </div>
                                    )}
                                    {selectedEntry.notes && (
                                        <div className="data-item full">
                                            <label>Developer's Notes</label>
                                            <div className="text-quote">{selectedEntry.notes}</div>
                                        </div>
                                    )}
                                </div>

                                <div className="action-panel">
                                    <h4 className="modal-subtitle">Assessment</h4>

                                    <div className="decision-toggle">
                                        <button
                                            type="button"
                                            className={`toggle-option pass ${qaReport.status === 'verified' ? 'active' : ''}`}
                                            onClick={() => setQaReport(p => ({ ...p, status: 'verified' }))}
                                        >
                                            <ShieldCheck size={18} /> PASSED
                                        </button>
                                        <button
                                            type="button"
                                            className={`toggle-option fail ${qaReport.status === 'failed' ? 'active' : ''}`}
                                            onClick={() => setQaReport(p => ({ ...p, status: 'failed' }))}
                                        >
                                            <AlertCircle size={18} /> FAILED
                                        </button>
                                    </div>

                                    <div className="form-group" style={{ marginTop: 24 }}>
                                        <label className="form-label">Test Report / Feedback</label>
                                        <textarea
                                            className="form-textarea"
                                            rows={8}
                                            value={qaReport.notes}
                                            onChange={e => setQaReport(p => ({ ...p, notes: e.target.value }))}
                                            placeholder={qaReport.status === 'verified' ? "Describe testing outcome (optional)..." : "Explain failure causes (required)..."}
                                            required={qaReport.status === 'failed'}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                                <button
                                    type="submit"
                                    className={`btn ${qaReport.status === 'verified' ? 'btn-success' : 'btn-danger'}`}
                                    style={{ padding: '10px 30px', fontWeight: 800 }}
                                    disabled={savingId === selectedEntry.id}
                                >
                                    {savingId === selectedEntry.id ? 'Saving...' : `CONFIRM ${qaReport.status === 'verified' ? 'PASS' : 'FAIL'}`}
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
                .tab:hover { color: var(--text); }
                .tab.active { background: var(--accent); color: white; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); }
                
                .compact-table { width: 100%; border-collapse: collapse; }
                .compact-table th { padding: 12px 16px; border-bottom: 2px solid var(--border); background: rgba(255,255,255,0.01); }
                .compact-table td { padding: 10px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
                .clickable-row { cursor: pointer; transition: background 0.2s; }
                .clickable-row:hover { background: var(--bg-card-hover); }
                
                .todo-cell { display: flex; flex-direction: column; gap: 2px; }
                .qa-flag { font-size: 10px; color: #ef4444; font-weight: 800; background: rgba(239, 68, 68, 0.08); padding: 2px 6px; border-radius: 4px; width: fit-content; margin-top: 4px; }
                
                .quick-actions { display: flex; gap: 6px; justify-content: flex-end; }
                .btn-icon-sm { width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; background: transparent; color: var(--text-muted); cursor: pointer; transition: all 0.2s; }
                .btn-icon-sm.pass:hover { background: #22c55e; color: white; border-color: #22c55e; }
                .btn-icon-sm.fail:hover { background: #ef4444; color: white; border-color: #ef4444; }
                .btn-icon-sm:hover:not(.pass):not(.fail) { background: var(--accent); color: white; border-color: var(--accent); }

                .empty-state-card { padding: 64px; text-align: center; color: var(--text-dim); }

                /* Split Modal Styling */
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
                .toggle-option:hover:not(.active) { background: var(--bg-card-hover); border-color: var(--text-dim); }

                @media (max-width: 800px) {
                    .split-body { grid-template-columns: 1fr; }
                    .detail-panel { border-right: none; border-bottom: 1px solid var(--border); }
                }

                @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
