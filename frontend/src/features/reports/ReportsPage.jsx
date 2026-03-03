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
    const [selectedTask, setSelectedTask] = useState(null)
    const [taskFilter, setTaskFilter] = useState('all')
    const [taskSearch, setTaskSearch] = useState('')

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

    const STATUS_BADGE = {
        pending: 'badge-gray',
        in_progress: 'badge-yellow',
        done: 'badge-green',
        verified: 'badge-primary',
        failed: 'badge-red'
    }

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
                                    { label: 'Project Development Cost', value: `₹${projectReport.total_project_cost?.toLocaleString() || 0}` },
                                ].map(s => (
                                    <div key={s.label} className="card" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value ?? '—'}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {projectReport.costing_breakdown?.length > 0 && (
                                <div className="card" style={{ marginBottom: 20 }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Costing Breakdown</h3>
                                    <div className="table-wrapper">
                                        <table className="table-sm">
                                            <thead style={{ background: 'rgba(var(--accent-rgb), 0.05)' }}>
                                                <tr>
                                                    <th>Developer</th>
                                                    <th className="text-right">Hours</th>
                                                    <th className="text-right">Rate (₹/h)</th>
                                                    <th className="text-right">Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {projectReport.costing_breakdown.map(item => (
                                                    <tr key={item.id}>
                                                        <td>{item.name}</td>
                                                        <td className="text-right">{item.totalHours}</td>
                                                        <td className="text-right">₹{item.hourlyRate}</td>
                                                        <td className="text-right"><strong>₹{item.totalCost?.toLocaleString()}</strong></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="card" style={{ marginBottom: 20, padding: '12px 16px', display: 'flex', gap: 16, alignItems: 'center', background: 'var(--bg-surface)' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>FILTERS:</div>
                                <select className="form-select form-select-sm" style={{ width: 140 }} value={taskFilter} onChange={e => setTaskFilter(e.target.value)}>
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="done">Done</option>
                                    <option value="verified">Verified</option>
                                    <option value="failed">Failed</option>
                                </select>
                                <input
                                    type="text"
                                    className="form-input form-input-sm"
                                    placeholder="Search tasks..."
                                    style={{ width: 200 }}
                                    value={taskSearch}
                                    onChange={e => setTaskSearch(e.target.value)}
                                />
                            </div>

                            <div className="table-wrapper">
                                <table>
                                    <thead style={{ background: 'rgba(var(--accent-rgb), 0.05)' }}>
                                        <tr>
                                            <th>Task</th>
                                            <th>Assignee</th>
                                            <th>Status</th>
                                            <th className="text-right">Est (h)</th>
                                            <th className="text-right">Actual (h)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(projectReport.tasks || [])
                                            .filter(t => (taskFilter === 'all' || t.status === taskFilter) &&
                                                (t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
                                                    t.assignee?.full_name?.toLowerCase().includes(taskSearch.toLowerCase())))
                                            .map(t => (
                                                <tr key={t.id}
                                                    onClick={() => setSelectedTask(t)}
                                                    style={{ cursor: 'pointer' }}
                                                    className="hover-row"
                                                >
                                                    <td style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</td>
                                                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.assignee?.full_name || '—'}</td>
                                                    <td><span className={`badge ${STATUS_BADGE[t.status] || 'badge-gray'}`}>{t.status?.replace('_', ' ')}</span></td>
                                                    <td className="text-right" style={{ fontSize: 12 }}>{t.estimated_hours || '—'}</td>
                                                    <td className="text-right" style={{ fontSize: 12 }}>{t.actual_hours?.toFixed(2) || '—'}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Task Detail Modal */}
                            {selectedTask && (
                                <div className="modal-overlay" onClick={() => setSelectedTask(null)} style={{
                                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    zIndex: 1500, backdropFilter: 'blur(4px)'
                                }}>
                                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                                        maxWidth: 550, width: '90%', background: 'var(--bg-card)', borderRadius: 16,
                                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                                        border: '1px solid var(--border-color)',
                                        overflow: 'hidden', animation: 'modalEntry 0.3s ease'
                                    }}>
                                        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' }}>
                                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Task Specification</h3>
                                            <button onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>&times;</button>
                                        </div>
                                        <div className="modal-body" style={{ padding: '24px' }}>
                                            <div style={{ marginBottom: 20 }}>
                                                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Task Title</label>
                                                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4 }}>{selectedTask.title}</div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
                                                <div>
                                                    <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Assignee</label>
                                                    <div style={{ fontSize: 15, fontWeight: 500 }}>{selectedTask.assignee?.full_name || 'Unassigned'}</div>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Status</label>
                                                    <div><span className={`badge ${STATUS_BADGE[selectedTask.status] || 'badge-gray'}`} style={{ padding: '4px 12px', fontSize: 12 }}>{selectedTask.status?.replace('_', ' ')}</span></div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
                                                <div style={{ background: 'rgba(var(--accent-rgb), 0.03)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(var(--accent-rgb), 0.1)' }}>
                                                    <label style={{ fontSize: 10, color: 'var(--accent-light)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 2 }}>Estimated Duration</label>
                                                    <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedTask.estimated_hours || 0}<small style={{ fontSize: 12, marginLeft: 2, fontWeight: 400 }}>hrs</small></div>
                                                </div>
                                                <div style={{ background: 'rgba(34, 197, 94, 0.04)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(34, 197, 94, 0.1)' }}>
                                                    <label style={{ fontSize: 10, color: '#22c55e', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 2 }}>Actual Time Spent</label>
                                                    <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedTask.actual_hours?.toFixed(2) || 0}<small style={{ fontSize: 12, marginLeft: 2, fontWeight: 400 }}>hrs</small></div>
                                                </div>
                                            </div>

                                            {selectedTask.description && (
                                                <div style={{ marginTop: 24 }}>
                                                    <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Description / Scope</label>
                                                    <div style={{
                                                        fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)',
                                                        background: 'var(--bg-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border-color)'
                                                    }}>
                                                        {selectedTask.description}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', textAlign: 'right', background: 'var(--bg-surface)' }}>
                                            <button className="btn btn-secondary" style={{ padding: '10px 24px', borderRadius: 10 }} onClick={() => setSelectedTask(null)}>Dismiss</button>
                                        </div>
                                    </div>
                                </div>
                            )}
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
