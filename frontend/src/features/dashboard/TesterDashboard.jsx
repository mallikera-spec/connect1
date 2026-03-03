import { useEffect, useState } from 'react';
import { FolderKanban, ListTodo, CheckCircle2, Clock, AlertCircle, Timer, ShieldCheck } from 'lucide-react';
import api from '../../lib/api';
import { StatCard, AttendanceWidget, NotificationCard } from './DashboardComponents';

export default function TesterDashboard({ dateRange }) {
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
    const verified = stats.tasks_by_status?.verified ?? 0;

    const todoDone = stats.timesheet_tasks_by_status?.done ?? 0;
    const todoVerified = stats.timesheet_tasks_by_status?.verified ?? 0;
    const todoFailed = stats.timesheet_tasks_by_status?.failed ?? 0;

    return (
        <div className="tester-dashboard">
            {/* Section 1: General Overview */}
            <div className="dashboard-section-header" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-light)' }}>
                    General Overview
                </h3>
            </div>
            <div className="stats-grid" style={{ marginBottom: 32 }}>
                <AttendanceWidget />
                <StatCard
                    icon={FolderKanban}
                    label="Test Projects"
                    value={stats.total_projects ?? 0}
                    color="rgba(79,70,229,0.25)"
                    to="/projects"
                    state={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={Timer}
                    label="Testing Hours"
                    value={`${stats.total_hours_logged ?? 0}h`}
                    color="rgba(139,92,246,0.25)"
                    to="/timesheet"
                    state={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
            </div>

            <div style={{ marginBottom: 32 }}>
                <NotificationCard />
            </div>

            {/* Section 2: Project Tasks (Active Bugs) */}
            <div className="dashboard-section-header" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-light)' }}>
                    Project Tasks (Active Bugs)
                </h3>
            </div>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 32 }}>
                <StatCard
                    icon={ListTodo}
                    label="Active Bugs/Tasks"
                    value={total}
                    color="rgba(59,130,246,0.25)"
                    to="/testing-tasks"
                    state={{ startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Ready for Testing"
                    value={done}
                    color="rgba(79,70,229,0.25)"
                    to="/testing-tasks"
                    state={{ status: 'done', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={Clock}
                    label="Testing in Progress"
                    value={inProgress}
                    color="rgba(245,158,11,0.25)"
                    to="/testing-tasks"
                    state={{ status: 'in_progress', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={ShieldCheck}
                    label="Verified (Passed)"
                    value={verified}
                    color="rgba(16,185,129,0.25)"
                    to="/testing-tasks"
                    state={{ status: 'verified', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={AlertCircle}
                    label="Failed (Rejected)"
                    value={stats.tasks_by_status?.failed ?? 0}
                    color="rgba(239,68,68,0.25)"
                    to="/testing-tasks"
                    state={{ status: 'failed', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
            </div>

            {/* Section 3: Timesheet Todos (Quick Testing) */}
            <div className="stats-grid" style={{ marginBottom: 32 }}>
                <StatCard
                    icon={CheckCircle2}
                    label="Todos Ready"
                    value={todoDone}
                    color="rgba(79,70,229,0.15)"
                    to="/testing-todos"
                    state={{ statusFilter: 'done', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={Timer}
                    label="Upcoming Todos"
                    value={(stats.timesheet_tasks_by_status?.todo || 0) + (stats.timesheet_tasks_by_status?.in_progress || 0)}
                    color="rgba(245,158,11,0.15)"
                    to="/testing-todos"
                    state={{ statusFilter: 'upcoming', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={ShieldCheck}
                    label="Verified Todos"
                    value={todoVerified}
                    color="rgba(16,185,129,0.15)"
                    to="/testing-todos"
                    state={{ statusFilter: 'verified', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
                <StatCard
                    icon={AlertCircle}
                    label="Failed Todos"
                    value={todoFailed}
                    color="rgba(239,68,68,0.15)"
                    to="/testing-todos"
                    state={{ statusFilter: 'failed', startDate: dateRange.startDate, endDate: dateRange.endDate }}
                />
            </div>

            {/* Quality Progress Bar */}
            {total > 0 && (
                <div className="card" style={{ padding: '16px 20px', marginTop: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                        <span style={{ fontWeight: 600 }}>Quality Assurance Progress</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{Math.round((verified / total) * 100)}% Verified</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${(verified / total) * 100}%`, background: '#10b981', transition: 'width 0.5s' }} />
                        <div style={{ width: `${(inProgress / total) * 100}%`, background: '#f59e0b', transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>🛡️ {verified} verified</span>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>🔍 {inProgress} testing</span>
                        <span style={{ fontWeight: 600 }}>⏳ {pending} waiting</span>
                        <span style={{ fontWeight: 600 }}>✅ {done} dev-done</span>
                    </div>
                </div>
            )}
        </div>
    );
}
