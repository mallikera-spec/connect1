import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FolderKanban, ListTodo, CheckCircle2, Clock, AlertCircle, Timer } from 'lucide-react';
import api from '../../lib/api';
import { StatCard, AttendanceWidget, NotificationCard } from './DashboardComponents';
import DataTable from '../../components/common/DataTable';

export default function DeveloperDashboard({ dateRange }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params = { startDate: dateRange.startDate, endDate: dateRange.endDate };

        api.get('/reports/me', { params })
            .then((res) => setStats(res.data.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [dateRange]);

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;
    if (!stats) return null;

    const total = stats.total_tasks ?? 0;
    const pending = stats.tasks_by_status?.pending ?? 0;
    const inProgress = stats.tasks_by_status?.in_progress ?? 0;
    const done = stats.tasks_by_status?.done ?? 0;

    const tsStats = stats.timesheet_tasks_by_status || {};
    const totalTodos = Object.values(tsStats).reduce((a, b) => a + b, 0);
    const inProgressTodos = tsStats.in_progress || 0;
    const blockedTodos = tsStats.blocked || 0;
    const pendingQaTodos = tsStats.done || 0;
    const verifiedTodos = tsStats.verified || 0;
    const failedTodos = tsStats.failed || 0;

    return (
        <div>
            <div className="dashboard-section-header" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-light)' }}>
                    Task Overview
                </h3>
            </div>
            <div className="stats-grid" style={{ marginBottom: 32 }}>
                <AttendanceWidget />
                <StatCard
                    icon={ListTodo}
                    label="Total Assigned Tasks"
                    value={total}
                    color="#3b82f6"
                    to="/tasks"
                    state={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={Clock}
                    label="In Progress"
                    value={inProgress}
                    color="#f59e0b"
                    to="/tasks"
                    state={{ status: 'in_progress', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={AlertCircle}
                    label="Pending Tasks"
                    value={pending}
                    color="#6b7280"
                    to="/tasks"
                    state={{ status: 'pending', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Completed Tasks"
                    value={done}
                    color="#10b981"
                    to="/tasks"
                    state={{ status: 'done', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={AlertCircle}
                    label="Failed (Need Fix)"
                    value={stats.tasks_by_status?.failed ?? 0}
                    color="#ef4444"
                    to="/tasks"
                    state={{ status: 'failed', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
            </div>

            <div className="dashboard-section-header" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-light)' }}>
                    Todo Overview (Timesheet)
                </h3>
            </div>
            <div className="stats-grid" style={{ marginBottom: 32 }}>
                {/* <StatCard
                    icon={Timer}
                    label="Hours Logged"
                    value={`${stats.total_hours_logged ?? 0}h`}
                    color="#8b5cf6"
                    to="/timesheet"
                    state={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
                /> */}
                <StatCard
                    icon={ListTodo}
                    label="Total Todos Logged"
                    value={totalTodos}
                    color="#3b82f6"
                    to="/timesheet"
                    state={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={Clock}
                    label="In Progress"
                    value={inProgressTodos}
                    color="#f59e0b"
                    to="/timesheet"
                    state={{ statusFilter: 'in_progress', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Done (Pending QA)"
                    value={pendingQaTodos}
                    color="#8b5cf6"
                    to="/timesheet"
                    state={{ statusFilter: 'done', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={AlertCircle}
                    label="Blocked"
                    value={blockedTodos}
                    color="#6b7280"
                    to="/timesheet"
                    state={{ statusFilter: 'blocked', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Verified (Passed)"
                    value={verifiedTodos}
                    color="#10b981"
                    to="/timesheet"
                    state={{ statusFilter: 'verified', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={AlertCircle}
                    label="Failed (Need Fix)"
                    value={failedTodos}
                    color="#ef4444"
                    to="/timesheet"
                    state={{ statusFilter: 'failed', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
            </div>

            <div className="dashboard-section-header" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-light)' }}>
                    Projects
                </h3>
            </div>
            <div className="stats-grid" style={{ marginBottom: 32 }}>
                <StatCard
                    icon={FolderKanban}
                    label="My Projects"
                    value={stats.total_projects ?? 0}
                    color="#4f46e5"
                    to="/projects"
                    state={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={FolderKanban}
                    label="Active Projects"
                    value={stats.active_projects_count || 0}
                    color="#ec4899"
                    to="/projects"
                />
            </div>

            <div className="dashboard-grid" style={{ marginTop: 24 }}>
                <NotificationCard />
                {total > 0 && (
                    <div className="card" style={{ padding: '16px 20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
                            <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task Completion</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{Math.round(((done + (stats.tasks_by_status?.verified || 0)) / total) * 100)}%</span>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ height: 12, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', display: 'flex' }}>
                                <div style={{ width: `${((done + (stats.tasks_by_status?.verified || 0)) / total) * 100}%`, background: '#10b981', transition: 'width 0.5s' }} />
                                <div style={{ width: `${(inProgress / total) * 100}%`, background: '#f59e0b', transition: 'width 0.5s' }} />
                                <div style={{ width: `${((stats.tasks_by_status?.failed || 0) / total) * 100}%`, background: '#ef4444', transition: 'width 0.5s' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginTop: 16, fontSize: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                                    <span style={{ color: 'var(--text-dim)' }}>Done:</span>
                                    <span style={{ fontWeight: 700 }}>{done + (stats.tasks_by_status?.verified || 0)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                                    <span style={{ color: 'var(--text-dim)' }}>In Progress:</span>
                                    <span style={{ fontWeight: 700 }}>{inProgress}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                                    <span style={{ color: 'var(--text-dim)' }}>Failed:</span>
                                    <span style={{ fontWeight: 700 }}>{stats.tasks_by_status?.failed || 0}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' }} />
                                    <span style={{ color: 'var(--text-dim)' }}>Pending:</span>
                                    <span style={{ fontWeight: 700 }}>{pending}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Tasks Section */}
            <div className="card" style={{ marginTop: 24, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ListTodo size={18} color="var(--accent)" />
                        Active Tasks
                    </h3>
                    <Link to="/tasks" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>View All</Link>
                </div>
                <DataTable
                    data={(stats.tasks || []).filter(t => ['pending', 'in_progress', 'failed'].includes(t.status))}
                    loading={loading}
                    fileName="active_tasks"
                    columns={[
                        { label: 'Task Title', key: 'title' },
                        { label: 'Project', key: 'projectName' },
                        { label: 'Status', key: 'status' },
                        { label: 'Priority', key: 'priority' }
                    ]}
                    renderRow={(task, idx) => (
                        <tr key={task.id}>
                            <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: 12 }}>{idx + 1}</td>
                            <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 600 }}>{task.title}</span>
                                    {task.qa_notes && (
                                        <span style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                            <AlertCircle size={10} /> {task.qa_notes.slice(0, 40)}...
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{task.projectName || '—'}</td>
                            <td style={{ padding: '12px 16px' }}>
                                <span className={`badge ${task.status === 'failed' ? 'badge-red' : task.status === 'in_progress' ? 'badge-yellow' : 'badge-gray'}`}>
                                    {task.status?.replace('_', ' ')}
                                </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <span className={`badge ${task.priority === 'high' ? 'badge-red' : task.priority === 'medium' ? 'badge-yellow' : 'badge-blue'}`}>
                                    {task.priority}
                                </span>
                            </td>
                        </tr>
                    )}
                />
            </div>

            {/* Todos Section */}
            <div className="card" style={{ marginTop: 24, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock size={18} color="var(--accent)" />
                        Recent Todos (Timesheet)
                    </h3>
                    <Link to="/timesheet" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>View All</Link>
                </div>
                <DataTable
                    data={stats.todos || []}
                    loading={loading}
                    fileName="recent_todos"
                    columns={[
                        { label: 'Date', key: 'work_date' },
                        { label: 'Title', key: 'title' },
                        { label: 'Hours', key: 'hours_spent' },
                        { label: 'Status', key: 'status' }
                    ]}
                    renderRow={(todo, idx) => (
                        <tr key={todo.id || idx}>
                            <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: 12 }}>{idx + 1}</td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                                {new Date(todo.work_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </td>
                            <td style={{ padding: '12px 16px' }}><span style={{ fontWeight: 600 }}>{todo.title}</span></td>
                            <td style={{ padding: '12px 16px' }}>{todo.hours_spent}h</td>
                            <td style={{ padding: '12px 16px' }}>
                                <span className={`badge ${todo.status === 'failed' ? 'badge-red' : todo.status === 'done' ? 'badge-green' : 'badge-yellow'}`}>
                                    {todo.status}
                                </span>
                            </td>
                        </tr>
                    )}
                />
            </div>
        </div>
    );
}
