import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Users, FolderKanban, ListTodo, CheckCircle2, Calendar } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

function StatCard({ icon: Icon, label, value, color, to, state }) {
    return (
        <Link to={to} state={state} style={{ textDecoration: 'none' }}>
            <div className="stat-card">
                <div>
                    <div className="stat-value">{value ?? '—'}</div>
                    <div className="stat-label">{label}</div>
                </div>
                <div className="stat-icon" style={{ background: color }}>
                    <Icon size={22} color="#fff" />
                </div>
            </div>
        </Link>
    )
}

function EmployeeCard({ employee, isAdminView, currentRange }) {
    const navigate = useNavigate();

    const goToTasks = (status = '') => {
        navigate('/tasks', {
            state: {
                assigned_to: employee.id,
                status,
                startDate: currentRange?.startDate,
                endDate: currentRange?.endDate
            }
        });
    };

    const goToPersonalTimesheet = () => {
        if (isAdminView) {
            navigate('/timesheet', {
                state: {
                    viewUserId: employee.id,
                    startDate: currentRange?.startDate,
                    endDate: currentRange?.endDate
                }
            });
        }
    };

    return (
        <div
            className="card"
            style={{
                padding: '16px',
                minWidth: '300px',
                flex: '1 1 350px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                cursor: isAdminView ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onClick={goToPersonalTimesheet}
            onMouseOver={(e) => isAdminView && (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseOut={(e) => isAdminView && (e.currentTarget.style.transform = 'translateY(0)')}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {employee.avatar_url ? (
                    <img src={employee.avatar_url} alt={employee.full_name} className="emp-avatar-img" />
                ) : (
                    <div className="user-avatar" style={{ margin: 0 }}>{employee.full_name?.slice(0, 2).toUpperCase()}</div>
                )}
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{employee.full_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{employee.designation || 'Specialist'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-light)' }}>{employee.total_hours}h</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Logged</div>
                </div>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: 0 }}>
                <div
                    style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => goToTasks()}
                >
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{employee.total_tasks}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tasks</div>
                </div>
                <div
                    style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => goToTasks('pending')}
                >
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-light)' }}>{employee.pending_tasks}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Pending</div>
                </div>
                <div
                    style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => goToTasks('done')}
                >
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)' }}>{employee.done_tasks}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Done</div>
                </div>
            </div>

            {employee.timesheet_items?.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                        Recent Timesheet Items
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {employee.timesheet_items.slice(0, 3).map(item => (
                            <div key={item.id} style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '6px', fontSize: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                    <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '8px' }}>
                                        {item.title}
                                    </span>
                                    <span style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{item.hours}</span>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{item.project}</span>
                                    <span>{new Date(item.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                        {employee.timesheet_items.length > 3 && (
                            <Link to="/reports" style={{ fontSize: '11px', color: 'var(--accent-light)', textDecoration: 'none', textAlign: 'center', marginTop: '4px' }}>
                                + {employee.timesheet_items.length - 3} more items
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

import DateRangePicker from '../../components/DateRangePicker'

export default function DashboardPage() {
    const navigate = useNavigate()
    const { user, hasPermission } = useAuth()
    const isAdmin = hasPermission('view_overall_report') || hasPermission('manage_projects')
    const [stats, setStats] = useState(null)
    const [employeeOverview, setEmployeeOverview] = useState(null)
    const [loading, setLoading] = useState(true)

    // Date range state
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        setLoading(true)
        const url = isAdmin ? '/reports/overall' : '/reports/me'
        const params = { startDate: dateRange.startDate, endDate: dateRange.endDate }

        const requests = [api.get(url, { params })]

        if (isAdmin) {
            requests.push(api.get('/reports/employee-overview', { params }))
        }

        Promise.all(requests)
            .then(([res1, res2]) => {
                setStats(res1.data.data)
                if (res2) setEmployeeOverview(res2.data.data)
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [isAdmin, dateRange])

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1>Dashboard</h1>
                    <p>{isAdmin ? "Welcome back — here's your organization overview" : `Welcome back, ${user?.full_name || 'Employee'}`}</p>
                </div>

                <DateRangePicker
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    onRangeChange={setDateRange}
                />
            </div>

            {loading ? (
                <div className="page-loader"><div className="spinner" /></div>
            ) : (
                <>
                    {!isAdmin && (
                        <div className="stats-grid">
                            <StatCard
                                icon={FolderKanban}
                                label="My Projects"
                                value={stats?.total_projects}
                                color="rgba(79,70,229,0.25)"
                                to="/projects"
                                state={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
                            />
                            <StatCard
                                icon={ListTodo}
                                label="Assigned Tasks"
                                value={stats?.total_tasks}
                                color="rgba(59,130,246,0.25)"
                                to="/tasks"
                                state={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
                            />
                            <StatCard
                                icon={CheckCircle2}
                                label="Pending Tasks"
                                value={stats?.tasks_by_status?.pending || 0}
                                color="rgba(245,158,11,0.25)"
                                to="/tasks"
                                state={{ status: 'pending', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                            />
                            <StatCard
                                icon={CheckCircle2}
                                label="My Hours Logged"
                                value={stats?.total_hours_logged}
                                color="rgba(34,197,94,0.25)"
                                to="/timesheet"
                                state={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
                            />
                        </div>
                    )}

                    {stats && (
                        <div className="dashboard-grid">
                            <div className="card polished-card">
                                <div className="polished-card-header">
                                    <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project Tasks</h3>
                                </div>
                                <div className="polished-card-body">
                                    {Object.entries(stats.tasks_by_status || {}).map(([status, count]) => (
                                        <div
                                            className="report-row clickable-row polished-row"
                                            key={status}
                                            onClick={() => navigate('/tasks', {
                                                state: {
                                                    status: status === 'pending' ? 'pending' : status === 'done' ? 'done' : 'in_progress',
                                                    startDate: dateRange.startDate,
                                                    endDate: dateRange.endDate
                                                }
                                            })}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className={`status-dot ${status}`} />
                                                <span style={{ textTransform: 'capitalize', fontSize: 13, fontWeight: 500 }}>{status.replace('_', ' ')}</span>
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: 14 }}>{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="card polished-card">
                                <div className="polished-card-header">
                                    <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timesheet Tasks</h3>
                                </div>
                                <div className="polished-card-body">
                                    {Object.entries(stats.timesheet_tasks_by_status || {}).map(([status, count]) => (
                                        <div
                                            className="report-row clickable-row polished-row"
                                            key={status}
                                            onClick={() => navigate('/timesheet', {
                                                state: {
                                                    statusFilter: status,
                                                    startDate: dateRange.startDate,
                                                    endDate: dateRange.endDate
                                                }
                                            })}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className={`status-dot ts-${status}`} />
                                                <span style={{ textTransform: 'capitalize', fontSize: 13, fontWeight: 500 }}>{status.replace('_', ' ')}</span>
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: 14 }}>{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="card polished-card">
                                    <div className="polished-card-header">
                                        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Actions</h3>
                                    </div>
                                    <div className="polished-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {[
                                            { label: '+ New User', to: '/users', icon: '👤', state: { openCreateModal: true } },
                                            { label: '+ New Project', to: '/projects', icon: '📂', state: { openCreateModal: true } },
                                            { label: '+ New Task', to: '/tasks', icon: '📝', state: { openCreateModal: true, startDate: dateRange.startDate, endDate: dateRange.endDate } },
                                            { label: 'Manage Roles', to: '/roles', icon: '🛡️' },
                                        ].map(a => (
                                            <button
                                                key={a.label}
                                                className="polished-action-btn"
                                                onClick={() => navigate(a.to, { state: a.state })}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <span style={{ fontSize: 18 }}>{a.icon}</span>
                                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{a.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {isAdmin && employeeOverview && (
                        <div style={{ marginTop: '32px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Employee Performance Overview</h2>
                            {Object.entries(employeeOverview).map(([dept, employees]) => (
                                <div key={dept} style={{ marginBottom: '32px' }}>
                                    <h3 style={{ fontSize: '14px', color: 'var(--accent-light)', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ padding: '4px 12px', background: 'var(--accent-transparent)', borderRadius: '20px' }}>{dept}</span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 400 }}>{employees.length} Members</span>
                                    </h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                                        {employees.map(emp => (
                                            <EmployeeCard key={emp.id} employee={emp} isAdminView={isAdmin} currentRange={dateRange} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
            <style>{`
                .polished-card {
                    padding: 0;
                    overflow: hidden;
                    border: 1px solid var(--border);
                    background: rgba(255, 255, 255, 0.03);
                }
                .polished-card-header {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 14px 20px;
                    border-bottom: 1px solid var(--border);
                    color: var(--accent-light);
                }
                .polished-card-body {
                    padding: 12px 0;
                }
                .polished-row {
                    padding: 10px 20px !important;
                    margin: 0 !important;
                    border-radius: 0 !important;
                }
                .polished-row:hover {
                    background: rgba(124, 58, 237, 0.08) !important;
                }
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .status-dot.pending { background: #94a3b8; }
                .status-dot.in_progress { background: #f59e0b; }
                .status-dot.done { background: #10b981; }
                .status-dot.ts-todo { background: #cbd5e1; }
                .status-dot.ts-in_progress { background: #fbbf24; }
                .status-dot.ts-done { background: #34d399; }
                .status-dot.ts-blocked { background: #ef4444; }

                .polished-action-btn {
                    border: none;
                    background: transparent;
                    padding: 10px 20px;
                    border-radius: 0;
                    justify-content: flex-start;
                    gap: 12px;
                    transition: all 0.2s;
                    font-weight: 500;
                    color: var(--text-muted);
                }
                .polished-action-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--text);
                    padding-left: 24px;
                }
                
                .emp-avatar-img {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid var(--border);
                }

                .clickable-row {
                    cursor: pointer;
                    transition: background 0.2s;
                    border-radius: 6px;
                    padding-left: 8px;
                    padding-right: 8px;
                    margin-left: -8px;
                    margin-right: -8px;
                }
                .clickable-row:hover {
                    background: var(--bg-app);
                }
            `}</style>
        </div>
    )
}
