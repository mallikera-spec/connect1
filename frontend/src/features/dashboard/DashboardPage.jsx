import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, FolderKanban, ListTodo, CheckCircle2 } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

function StatCard({ icon: Icon, label, value, color, to }) {
    return (
        <Link to={to} style={{ textDecoration: 'none' }}>
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

export default function DashboardPage() {
    const { user, hasPermission } = useAuth()
    const isAdmin = hasPermission('view_overall_report') || hasPermission('manage_projects')
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const url = isAdmin ? '/reports/overall' : '/reports/me'
        api.get(url)
            .then(r => setStats(r.data.data))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [isAdmin])

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>{isAdmin ? "Welcome back — here's your organization overview" : `Welcome back, ${user?.full_name || 'Employee'}`}</p>
                </div>
            </div>

            {loading ? (
                <div className="page-loader"><div className="spinner" /></div>
            ) : (
                <>
                    <div className="stats-grid">
                        {isAdmin ? (
                            <>
                                <StatCard icon={Users} label="Total Users" value={stats?.total_users} color="rgba(124,58,237,0.25)" to="/users" />
                                <StatCard icon={FolderKanban} label="Total Projects" value={stats?.total_projects} color="rgba(79,70,229,0.25)" to="/projects" />
                                <StatCard icon={ListTodo} label="Total Tasks" value={stats?.total_tasks} color="rgba(59,130,246,0.25)" to="/tasks" />
                                <StatCard icon={CheckCircle2} label="Hours Logged" value={stats?.total_hours_logged} color="rgba(34,197,94,0.25)" to="/reports" />
                            </>
                        ) : (
                            <>
                                <StatCard icon={FolderKanban} label="My Projects" value={stats?.total_projects} color="rgba(79,70,229,0.25)" to="/projects" />
                                <StatCard icon={ListTodo} label="Assigned Tasks" value={stats?.total_tasks} color="rgba(59,130,246,0.25)" to="/tasks" />
                                <StatCard icon={CheckCircle2} label="My Hours Logged" value={stats?.total_hours_logged} color="rgba(34,197,94,0.25)" to="/timesheet" />
                            </>
                        )}
                    </div>

                    {stats && (
                        <div className="dashboard-grid">
                            <div className="card">
                                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Tasks by Status</h3>
                                {Object.entries(stats.tasks_by_status || {}).map(([status, count]) => (
                                    <div className="report-row" key={status}>
                                        <span style={{ textTransform: 'capitalize', fontSize: 13 }}>{status.replace('_', ' ')}</span>
                                        <span style={{ fontWeight: 600 }}>{count}</span>
                                    </div>
                                ))}
                            </div>
                            {isAdmin && (
                                <div className="card">
                                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Quick Actions</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {[
                                            { label: '+ New User', to: '/users' },
                                            { label: '+ New Project', to: '/projects' },
                                            { label: '+ New Task', to: '/tasks' },
                                            { label: 'Manage Roles', to: '/roles' },
                                        ].map(a => (
                                            <Link key={a.to} to={a.to} className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>{a.label}</Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
