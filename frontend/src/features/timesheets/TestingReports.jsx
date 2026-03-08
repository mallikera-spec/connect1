import { useEffect, useState, useMemo } from 'react'
import { ShieldCheck, Search, Users, Briefcase, Clock, FileBarChart, Filter, CheckCircle2, AlertCircle, Download, FileText } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import DateRangePicker from '../../components/DateRangePicker'

const STATUS_BADGE = {
    verified: 'badge-green',
    failed: 'badge-red'
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export default function TestingReports() {
    const { user } = useAuth()
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [allUsers, setAllUsers] = useState([])
    const [allProjects, setAllProjects] = useState([])
    const [selectedUserId, setSelectedUserId] = useState('')
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))

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
            ).filter(e => ['verified', 'failed'].includes(e.status))

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

    useEffect(() => {
        loadEntries()
    }, [startDate, endDate])

    const filtered = useMemo(() => {
        return entries.filter(e => {
            const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.userName.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesUser = !selectedUserId || e.userId === selectedUserId
            const matchesProject = !selectedProjectId || e.project_id === selectedProjectId

            return matchesSearch && matchesUser && matchesProject
        })
    }, [entries, searchTerm, selectedUserId, selectedProjectId])

    const stats = useMemo(() => {
        const total = filtered.length
        const passed = filtered.filter(e => e.status === 'verified').length
        const failed = filtered.filter(e => e.status === 'failed').length
        const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0
        return { total, passed, failed, passRate }
    }, [filtered])

    const handleExportCSV = () => {
        if (!filtered.length) return
        const headers = ['Date', 'Developer', 'Project', 'Title', 'Hours', 'Result', 'QA Notes']
        const rows = filtered.map(e => [
            e.date ? new Date(e.date).toLocaleDateString() : '',
            `"${e.userName || ''}"`,
            `"${e.project?.name || 'In-House'}"`,
            `"${e.title || ''}"`,
            e.hours_spent || '',
            e.status === 'verified' ? 'PASSED' : 'FAILED',
            `"${(e.qa_notes || '').replace(/"/g, '""')}"`
        ])
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
        const link = document.createElement('a')
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
        link.download = `testing_reports_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }

    const handleExportPDF = () => window.print()

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <h1>Testing Reports</h1>
                    <p>Consolidated view of all verification results</p>
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

            {/* Stats Overview */}
            <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                <div className="card shadow-sm" style={{ padding: 20 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Tested</label>
                    <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{stats.total}</div>
                </div>
                <div className="card shadow-sm" style={{ padding: 20, borderLeft: '4px solid #22c55e' }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Passed</label>
                    <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#22c55e' }}>{stats.passed}</div>
                </div>
                <div className="card shadow-sm" style={{ padding: 20, borderLeft: '4px solid #ef4444' }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Failed</label>
                    <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#ef4444' }}>{stats.failed}</div>
                </div>
                <div className="card shadow-sm" style={{ padding: 20 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Pass Rate</label>
                    <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: 'var(--accent-light)' }}>{stats.passRate}%</div>
                </div>
            </div>

            {/* Filters Panel */}
            <div className="card shadow-sm" style={{ marginBottom: 24, padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <div className="form-group">
                        <label className="form-label"><Search size={12} style={{ marginRight: 6 }} /> Search</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search todos..."
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
            </div>

            {/* Table View */}
            <div className="table-wrapper shadow-sm">
                {loading ? (
                    <div className="page-loader" style={{ height: 200 }}><div className="spinner" /></div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 60, textAlign: 'center', opacity: 0.5 }}>
                        <FileBarChart size={48} style={{ marginBottom: 16 }} />
                        <h3>No report data found</h3>
                        <p>Adjust your filters or date range.</p>
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
                                <th style={{ width: 100 }}>Result</th>
                                <th style={{ width: 200 }}>QA Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(entry => (
                                <tr key={entry.id}>
                                    <td style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>{fmt(entry.date)}</td>
                                    <td style={{ fontSize: 13, fontWeight: 600 }}>{entry.userName}</td>
                                    <td>
                                        <span className="badge-pill badge-purple" style={{ fontSize: 9 }}>
                                            {(entry.project?.name || 'In-House').toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{entry.title}</div>
                                    </td>
                                    <td style={{ fontWeight: 800 }}>{entry.hours_spent}</td>
                                    <td>
                                        <span className={`badge-pill ${STATUS_BADGE[entry.status]}`} style={{ fontSize: 9 }}>
                                            {entry.status === 'verified' ? 'PASSED' : 'FAILED'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 11, fontWeight: 600, color: entry.status === 'verified' ? 'var(--text-muted)' : '#ef4444' }}>
                                        {entry.qa_notes || <span style={{ opacity: 0.3 }}>—</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <style>{`
                .compact-table { width: 100%; border-collapse: collapse; }
                .compact-table th { padding: 12px 16px; border-bottom: 2px solid var(--border); background: rgba(255,255,255,0.01); text-align: left; font-size: 11px; text-transform: uppercase; color: var(--text-muted); }
                .compact-table td { padding: 10px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
                .tab.active { background: var(--accent); color: white; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); }
            `}</style>
        </div>
    )
}
