import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Calendar } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { SalesService } from '../sales/SalesService'
import DateRangePicker from '../../components/DateRangePicker'
import { getISTMonthStartString, getISTTodayString } from '../../lib/dateUtils'
import DataTable from '../../components/common/DataTable'

import DeveloperPerformance from './DeveloperPerformance'
import BDMPerformance from './BDMPerformance'
import DeveloperLeaderboard from './DeveloperLeaderboard'
import ExecutiveBI from './ExecutiveBI'

export default function ReportsPage() {
    const { hasPermission } = useAuth()
    const navigate = useNavigate()
    const [tab, setTab] = useState('')
    const [overall, setOverall] = useState(null)

    const [projects, setProjects] = useState([])
    const [selectedProjectIds, setSelectedProjectIds] = useState([])
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
    const bdm_allowed = hasPermission('view_leads')

    const [employeeOverview, setEmployeeOverview] = useState(null)

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
        else if (bdm_allowed) setTab('bdm')
        else if (projects_allowed) setTab('project')
        else if (users_allowed) setTab('user')

        if (projects_allowed) api.get('/projects').then(r => setProjects(r.data.data)).catch(() => { })
        if (users_allowed) api.get('/users').then(r => setUsers(r.data.data)).catch(() => { })
    }, [overall_allowed, projects_allowed, users_allowed])

    useEffect(() => {
        loadOverall()
        if (bdm_allowed) loadEmployeeOverview()
        if (selectedProjectIds.length > 0) loadProjectReport()
        if (selectedUser) loadUserReport()
    }, [dateRange, loadOverall, bdm_allowed])

    const loadEmployeeOverview = () => {
        api.get('/reports/employee-overview', { params: dateRange })
            .then(res => setEmployeeOverview(res.data.data))
            .catch(() => { })
    }

    const loadProjectReport = async () => {
        if (selectedProjectIds.length === 0) return
        setLoading(true)
        try {
            const r = await api.get('/reports/projects', {
                params: {
                    ...dateRange,
                    ids: selectedProjectIds.join(',')
                }
            });
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
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1>Reports</h1>
                        <p>Aggregated metrics and performance insights</p>
                    </div>
                </div>
            </div>

            {['overall', 'project', 'user'].includes(tab) && (
                <div className="card" style={{ marginBottom: 24, padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--accent-light)', opacity: 0.9 }}>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--accent-light)' }}>DATE RANGE FILTER</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)' }}>Select period for all report tabs</p>
                    </div>
                    <DateRangePicker
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        onRangeChange={setDateRange}
                    />
                </div>
            )}

            <div style={{ marginBottom: 24 }}>
                <div className="tabs">
                    {overall_allowed && (
                        <button className={`tab-btn${tab === 'overall' ? ' active' : ''}`} onClick={() => setTab('overall')}>
                            Overall
                        </button>
                    )}
                    {projects_allowed && (
                        <button className={`tab-btn${tab === 'project' ? ' active' : ''}`} onClick={() => setTab('project')}>
                            Projects
                        </button>
                    )}
                    {users_allowed && (
                        <button className={`tab-btn${tab === 'user' ? ' active' : ''}`} onClick={() => setTab('user')}>
                            User
                        </button>
                    )}
                    {bdm_allowed && (
                        <button className={`tab-btn${tab === 'bdm' ? ' active' : ''}`} onClick={() => setTab('bdm')}>
                            BDM Performance
                        </button>
                    )}
                    {users_allowed && (
                        <button className={`tab-btn${tab === 'dev_perf' ? ' active' : ''}`} onClick={() => setTab('dev_perf')}>
                            Dev Performance Matrix
                        </button>
                    )}
                    {users_allowed && (
                        <button className={`tab-btn${tab === 'leaderboard' ? ' active' : ''}`} onClick={() => setTab('leaderboard')}>
                            Leaderboard
                        </button>
                    )}
                    {overall_allowed && (
                        <button className={`tab-btn${tab === 'exec_bi' ? ' active' : ''}`} onClick={() => setTab('exec_bi')} style={{ color: 'var(--accent-light)', borderColor: 'var(--accent-light)' }}>
                            ✨ Executive AI
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
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>SELECT PROJECTS</span>
                                <button
                                    className="btn-text"
                                    onClick={() => {
                                        if (selectedProjectIds.length === projects.length) setSelectedProjectIds([])
                                        else setSelectedProjectIds(projects.map(p => p.id))
                                    }}
                                    style={{ fontSize: 11, cursor: 'pointer' }}
                                >
                                    {selectedProjectIds.length === projects.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </label>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '10px',
                                maxHeight: '350px',
                                overflowY: 'auto',
                                padding: '16px',
                                background: 'var(--bg-app)',
                                borderRadius: '12px',
                                border: '2px solid var(--border)',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                {(projects || []).map(p => (
                                    <label key={p.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        transition: 'all 0.2s',
                                        background: selectedProjectIds.includes(p.id) ? 'rgba(var(--accent-rgb), 0.1)' : 'transparent',
                                        border: `1px solid ${selectedProjectIds.includes(p.id) ? 'var(--accent-light)' : 'transparent'}`
                                    }}>
                                        <input
                                            type="checkbox"
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            checked={selectedProjectIds.includes(p.id)}
                                            onChange={e => {
                                                if (e.target.checked) setSelectedProjectIds(prev => [...prev, p.id])
                                                else setSelectedProjectIds(prev => prev.filter(id => id !== p.id))
                                            }}
                                        />
                                        <span className="text-truncate" style={{ fontWeight: selectedProjectIds.includes(p.id) ? 600 : 400 }}>{p.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                            <button className="btn btn-primary" onClick={loadProjectReport} disabled={selectedProjectIds.length === 0 || loading}>
                                {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Generate Aggregated Report'}
                            </button>
                        </div>
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
                                    <DataTable
                                        data={projectReport.costing_breakdown}
                                        fileName={`costing_breakdown_${dateRange.startDate}_to_${dateRange.endDate}`}
                                        columns={[
                                            { label: 'Developer', key: 'name' },
                                            { label: 'Man-Hours', key: 'totalHours', render: (val) => <div className="text-right">{val}</div> },
                                            { label: 'Rate (₹/h)', key: 'hourlyRate', render: (val) => <div className="text-right">₹{val}</div> },
                                            { label: 'Cost', key: 'totalCost', render: (val) => <div className="text-right"><strong>₹{val?.toLocaleString()}</strong></div> }
                                        ]}
                                    />
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

                            <div style={{ marginBottom: 40 }}>
                                <DataTable
                                    loading={loading}
                                    data={(projectReport.tasks || []).filter(t => (taskFilter === 'all' || t.status === taskFilter) &&
                                        (t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
                                            t.assignee?.full_name?.toLowerCase().includes(taskSearch.toLowerCase())))}
                                    fileName={`project_report_tasks_${dateRange.startDate}_to_${dateRange.endDate}`}
                                    columns={[
                                        { label: 'Task', key: 'title', render: (val) => <span style={{ fontSize: 13, fontWeight: 500 }}>{val}</span> },
                                        ...(selectedProjectIds.length > 1 ? [{ label: 'Project', key: 'project.name', render: (val) => <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{val || '—'}</span> }] : []),
                                        { label: 'Assignee', key: 'assignee.full_name', render: (val) => <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{val || '—'}</span> },
                                        { label: 'Status', key: 'status', render: (val) => <span className={`badge ${STATUS_BADGE[val] || 'badge-gray'}`}>{val?.replace('_', ' ')}</span> },
                                        { label: 'Est (h)', key: 'estimated_hours', render: (val) => <span style={{ fontSize: 12 }}>{val || '—'}</span> },
                                        { label: 'Actual (h)', key: 'actual_hours', render: (val) => <span style={{ fontSize: 12 }}>{val?.toFixed(2) || '—'}</span> },
                                        {
                                            label: 'Action',
                                            key: 'id',
                                            render: (_, t) => (
                                                <button className="btn btn-text" onClick={() => setSelectedTask(t)}>Details</button>
                                            )
                                        }
                                    ]}
                                />
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
                            <div style={{ marginBottom: 40 }}>
                                <DataTable
                                    loading={loading}
                                    data={userReport.tasks || []}
                                    fileName={`user_report_tasks_${dateRange.startDate}_to_${dateRange.endDate}`}
                                    columns={[
                                        { label: 'Task', key: 'title', render: (val) => <span style={{ fontSize: 13 }}>{val}</span> },
                                        { label: 'Project', key: 'project.name', render: (val) => <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{val || '—'}</span> },
                                        { label: 'Status', key: 'status', render: (val) => <span className={`badge ${STATUS_BADGE[val] || 'badge-gray'}`}>{val?.replace('_', ' ')}</span> },
                                        { label: 'Est (h)', key: 'estimated_hours', render: (val) => <span style={{ fontSize: 12 }}>{val || '—'}</span> },
                                        { label: 'Actual (h)', key: 'actual_hours', render: (val) => <span style={{ fontSize: 12 }}>{val?.toFixed(2) || '—'}</span> }
                                    ]}
                                />
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── BDM Performance Report ── */}
            {tab === 'bdm' && (
                <div style={{ marginTop: '-16px' }}>
                    <BDMPerformance />
                </div>
            )}

            {/* ── Developer Performance Report ── */}
            {tab === 'dev_perf' && (
                <div style={{ marginTop: '-16px' }}>
                    <DeveloperPerformance />
                </div>
            )}

            {/* ── Developer Leaderboard ── */}
            {tab === 'leaderboard' && (
                <div style={{ marginTop: '-16px' }}>
                    <DeveloperLeaderboard />
                </div>
            )}

            {/* ── Executive AI ── */}
            {tab === 'exec_bi' && (
                <div style={{ marginTop: '-16px' }}>
                    <ExecutiveBI />
                </div>
            )}
        </div>
    )
}
