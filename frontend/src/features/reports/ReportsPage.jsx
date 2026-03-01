import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Calendar } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { SalesService } from '../sales/SalesService'
import DateRangePicker from '../../components/DateRangePicker'
import { getISTMonthStartString, getISTTodayString } from '../../lib/dateUtils'

export default function ReportsPage() {
    const { hasPermission } = useAuth()
    const [tab, setTab] = useState('')
    const [overall, setOverall] = useState(null)

    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState('')
    const [projectReport, setProjectReport] = useState(null)

    const [users, setUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState('')
    const [userReport, setUserReport] = useState(null)

    const [loading, setLoading] = useState(false)
    const projects_allowed = hasPermission('view_project_report')
    const users_allowed = hasPermission('view_user_report')
    const overall_allowed = hasPermission('view_overall_report')

    const [dateRange, setDateRange] = useState({
        startDate: getISTMonthStartString(),
        endDate: getISTTodayString()
    })

    const loadOverall = useCallback(() => {
        if (!overall_allowed) return
        api.get('/reports/overall', { params: dateRange })
            .then(r => setOverall(r.data.data))
            .catch(() => { })
    }, [overall_allowed, dateRange])

    useEffect(() => {
        // Default tab selection
        if (overall_allowed) setTab('overall')
        else if (projects_allowed) setTab('project')
        else if (users_allowed) setTab('user')

        if (projects_allowed) api.get('/projects').then(r => setProjects(r.data.data)).catch(() => { })
        if (users_allowed) api.get('/users').then(r => setUsers(r.data.data)).catch(() => { })
    }, [overall_allowed, projects_allowed, users_allowed])

    useEffect(() => {
        loadOverall()
        if (selectedProject) loadProjectReport()
        if (selectedUser) loadUserReport()
    }, [dateRange, loadOverall])

    const loadProjectReport = async () => {
        if (!selectedProject) return
        setLoading(true)
        try {
            const r = await api.get(`/reports/project/${selectedProject}`, { params: dateRange });
            setProjectReport(r.data.data)
        }
        catch (err) { toast.error(err.message) }
        finally { setLoading(false) }
    }

    const loadUserReport = async () => {
        if (!selectedUser) return
        setLoading(true)
        try {
            const r = await api.get(`/reports/user/${selectedUser}`, { params: dateRange });
            setUserReport(r.data.data)
        }
        catch (err) { toast.error(err.message) }
        finally { setLoading(false) }
    }

    const STATUS_BADGE = { pending: 'badge-gray', in_progress: 'badge-yellow', done: 'badge-green' }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                    <h1>Reports</h1>
                    <p>Hours logged, task completion, and team performance</p>
                </div>

                <DateRangePicker
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    onRangeChange={setDateRange}
                />
            </div>

            <div style={{ marginBottom: 24 }}>
                <div className="tabs">
                    {overall_allowed && (
                        <button className={`tab-btn${tab === 'overall' ? ' active' : ''}`} onClick={() => setTab('overall')}>
                            Overall
                        </button>
                    )}
                    {projects_allowed && (
                        <button className={`tab-btn${tab === 'project' ? ' active' : ''}`} onClick={() => setTab('project')}>
                            Project
                        </button>
                    )}
                    {users_allowed && (
                        <button className={`tab-btn${tab === 'user' ? ' active' : ''}`} onClick={() => setTab('user')}>
                            User
                        </button>
                    )}
                </div>
            </div>

            {/* ── Overall ── */}
            {tab === 'overall' && (
                <div>
                    {overall ? (
                        <div className="stats-grid">
                            {[
                                { label: 'Total Users', value: overall.total_users },
                                { label: 'Total Projects', value: overall.total_projects },
                                { label: 'Total Tasks', value: overall.total_tasks },
                                { label: 'Hours Logged', value: overall.total_hours_logged },
                            ].map(s => (
                                <div key={s.label} className="card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 32, fontWeight: 700 }}>{s.value ?? '—'}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    ) : <div className="page-loader"><div className="spinner" /></div>}

                    {overall?.tasks_by_status && (
                        <div className="card" style={{ maxWidth: 400, marginTop: 0 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Tasks by Status</h3>
                            {Object.entries(overall.tasks_by_status).map(([k, v]) => (
                                <div className="report-row" key={k}>
                                    <span style={{ textTransform: 'capitalize', fontSize: 13 }}>{k.replace('_', ' ')}</span>
                                    <strong>{v}</strong>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Project Report ── */}
            {tab === 'project' && (
                <div>
                    <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 20 }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Select Project</label>
                            <select className="form-select" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                                <option value="">Choose…</option>
                                {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <button className="btn btn-primary" onClick={loadProjectReport} disabled={!selectedProject || loading}>
                            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Generate'}
                        </button>
                    </div>

                    {projectReport && (
                        <>
                            <div className="stats-grid" style={{ marginBottom: 20 }}>
                                {[
                                    { label: 'Total Tasks', value: projectReport.total_tasks },
                                    { label: 'Est. Hours', value: projectReport.total_estimated_hours },
                                    { label: 'Actual Hours', value: projectReport.total_actual_hours },
                                    { label: 'Pending', value: projectReport.tasks_by_status?.pending },
                                ].map(s => (
                                    <div key={s.label} className="card" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 28, fontWeight: 700 }}>{s.value ?? '—'}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Task</th><th>Assignee</th><th>Status</th><th>Est (h)</th><th>Actual (h)</th></tr></thead>
                                    <tbody>
                                        {(projectReport.tasks || []).map(t => (
                                            <tr key={t.id}>
                                                <td style={{ fontSize: 13 }}>{t.title}</td>
                                                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.assigned_to || '—'}</td>
                                                <td><span className={`badge ${STATUS_BADGE[t.status] || 'badge-gray'}`}>{t.status?.replace('_', ' ')}</span></td>
                                                <td style={{ fontSize: 12 }}>{t.estimated_hours || '—'}</td>
                                                <td style={{ fontSize: 12 }}>{t.actual_hours?.toFixed(2) || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── User Report ── */}
            {tab === 'user' && (
                <div>
                    <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 20 }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Select User</label>
                            <select className="form-select" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                                <option value="">Choose…</option>
                                {(users || []).map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                            </select>
                        </div>
                        <button className="btn btn-primary" onClick={loadUserReport} disabled={!selectedUser || loading}>
                            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Generate'}
                        </button>
                    </div>

                    {userReport && (
                        <>
                            <div className="stats-grid" style={{ marginBottom: 20 }}>
                                {[
                                    { label: 'Total Tasks', value: userReport.total_tasks },
                                    { label: 'Hours Logged', value: userReport.total_hours_logged },
                                    { label: 'Done', value: userReport.tasks_by_status?.done },
                                    { label: 'In Progress', value: userReport.tasks_by_status?.in_progress },
                                ].map(s => (
                                    <div key={s.label} className="card" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 28, fontWeight: 700 }}>{s.value ?? '—'}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Task</th><th>Project</th><th>Status</th><th>Est (h)</th><th>Actual (h)</th></tr></thead>
                                    <tbody>
                                        {(userReport.tasks || []).map(t => (
                                            <tr key={t.id}>
                                                <td style={{ fontSize: 13 }}>{t.title}</td>
                                                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.project?.name || '—'}</td>
                                                <td><span className={`badge ${STATUS_BADGE[t.status] || 'badge-gray'}`}>{t.status?.replace('_', ' ')}</span></td>
                                                <td style={{ fontSize: 12 }}>{t.estimated_hours || '—'}</td>
                                                <td style={{ fontSize: 12 }}>{t.actual_hours?.toFixed(2) || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
