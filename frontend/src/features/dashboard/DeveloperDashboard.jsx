import { useEffect, useState } from 'react';
import { FolderKanban, ListTodo, CheckCircle2, Clock, AlertCircle, Timer } from 'lucide-react';
import api from '../../lib/api';
import { StatCard, AttendanceWidget } from './DashboardComponents';

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

    return (
        <div>
            <div className="stats-grid">
                <AttendanceWidget />
                <StatCard
                    icon={FolderKanban}
                    label="My Projects"
                    value={stats.total_projects ?? 0}
                    color="rgba(79,70,229,0.25)"
                    to="/projects"
                    state={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={ListTodo}
                    label="Total Assigned Tasks"
                    value={total}
                    color="rgba(59,130,246,0.25)"
                    to="/tasks"
                    state={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={Clock}
                    label="In Progress"
                    value={inProgress}
                    color="rgba(245,158,11,0.25)"
                    to="/tasks"
                    state={{ status: 'in_progress', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={AlertCircle}
                    label="Pending Tasks"
                    value={pending}
                    color="rgba(107,114,128,0.25)"
                    to="/tasks"
                    state={{ status: 'pending', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Completed Tasks"
                    value={done}
                    color="rgba(16,185,129,0.25)"
                    to="/tasks"
                    state={{ status: 'done', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={AlertCircle}
                    label="Failed (Need Fix)"
                    value={stats.tasks_by_status?.failed ?? 0}
                    color="rgba(239,68,68,0.25)"
                    to="/tasks"
                    state={{ status: 'failed', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={AlertCircle}
                    label="Failed Todos"
                    value={stats.timesheet_tasks_by_status?.failed ?? 0}
                    color="rgba(239,68,68,0.2)"
                    to="/timesheet"
                    state={{ statusFilter: 'failed', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={Timer}
                    label="Hours Logged"
                    value={`${stats.total_hours_logged ?? 0}h`}
                    color="rgba(139,92,246,0.25)"
                    to="/timesheet"
                    state={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
            </div>

            {/* Task Progress Bar */}
            {total > 0 && (
                <div className="card" style={{ padding: '16px 20px', marginTop: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                        <span style={{ fontWeight: 600 }}>Task Completion</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{Math.round(((done + (stats.tasks_by_status?.verified || 0)) / total) * 100)}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${((done + (stats.tasks_by_status?.verified || 0)) / total) * 100}%`, background: '#10b981', transition: 'width 0.5s' }} />
                        <div style={{ width: `${(inProgress / total) * 100}%`, background: '#f59e0b', transition: 'width 0.5s' }} />
                        <div style={{ width: `${((stats.tasks_by_status?.failed || 0) / total) * 100}%`, background: '#ef4444', transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>✅ {done + (stats.tasks_by_status?.verified || 0)} done</span>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>🔄 {inProgress} in progress</span>
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>❌ {stats.tasks_by_status?.failed || 0} failed</span>
                        <span style={{ fontWeight: 600 }}>⏳ {pending} pending</span>
                    </div>
                </div>
            )}
        </div>
    );
}
