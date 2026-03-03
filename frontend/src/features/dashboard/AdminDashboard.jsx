import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { EmployeeCard, StatCard, NotificationCard } from './DashboardComponents';
import { HRService } from '../hr/HRService';
import { Clock, Calendar, ArrowRight, DollarSign, TrendingUp, FileText, CheckCircle, IndianRupee } from 'lucide-react';

export default function AdminDashboard({ dateRange }) {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [bdms, setBdms] = useState([]);
    const [testers, setTesters] = useState([]);
    const [developers, setDevelopers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hrStats, setHrStats] = useState({ pendingAttendance: 0, pendingLeaves: 0 });
    const [salesStats, setSalesStats] = useState({ pipelineValue: 0, wonValue: 0, conversionRate: 0 });
    const [overallMilestones, setOverallMilestones] = useState([]);

    useEffect(() => {
        setLoading(true);
        const params = { startDate: dateRange.startDate, endDate: dateRange.endDate };

        Promise.all([
            api.get('/reports/overall', { params }),
            api.get('/reports/employee-overview', { params }),
            api.get('/sales/metrics', { params }),
            api.get('/milestones/overall')
        ])
            .then(([res1, res2, res3, res4]) => {
                setStats(res1.data.data);

                if (res2) {
                    const allDepts = res2.data.data || {};
                    const bdmList = [];
                    const testerList = [];
                    const developerList = [];
                    Object.values(allDepts).forEach(users => {
                        users.forEach(u => {
                            // Check roles or department for developer identification
                            const isDeveloper = !u.isTester && !u.sales_stats &&
                                (u.department?.toLowerCase() === 'engineering' || u.department?.toLowerCase() === 'development');

                            if (u.sales_stats) bdmList.push(u);
                            else if (u.isTester) testerList.push(u);
                            else if (isDeveloper) developerList.push(u);
                        });
                    });
                    setBdms(bdmList);
                    setTesters(testerList);
                    setDevelopers(developerList);
                }

                if (res3) setSalesStats(res3.data.data);
                if (res4) setOverallMilestones(res4.data.data);
            })
            .catch(() => { })
            .finally(() => setLoading(false));

        // Load HR pending counts independently  
        Promise.all([
            HRService.getPendingAttendance(),
            HRService.getPendingLeaves(),
        ]).then(([att, lv]) => {
            setHrStats({
                pendingAttendance: (att.data || []).length,
                pendingLeaves: (lv.data || []).length,
            });
        }).catch(() => { });
    }, [dateRange]);

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;
    if (!stats) return null;

    return (
        <div>
            {/* Top Metrics Row */}
            <div className="dashboard-grid" style={{ marginTop: 0 }}>
                <StatCard
                    label="Deal Wins"
                    value={`Rs ${(salesStats?.wonValue || 0).toLocaleString()}`}
                    icon={IndianRupee}
                    color="#10b981"
                    to="/leads"
                    state={{ status: 'Won', ...dateRange }}
                />

                <StatCard
                    label="Total Pipeline"
                    value={`Rs ${(salesStats?.pipelineValue || 0).toLocaleString()}`}
                    icon={TrendingUp}
                    color="#7c3aed"
                    to="/leads"
                    state={{ status: 'Proposal', ...dateRange }}
                />

                <StatCard
                    label="Conversion"
                    value={`${(salesStats?.conversionRate || 0).toFixed(1)}%`}
                    icon={CheckCircle}
                    color="#f59e0b"
                    to="/leads"
                    state={{ status: 'Won', ...dateRange }}
                />
                <StatCard
                    label="Won Deals"
                    value={salesStats?.Won || 0}
                    icon={CheckCircle}
                    color="#3b82f6"
                    to="/leads"
                    state={{ status: 'Won', ...dateRange }}
                />
            </div>

            <div className="dashboard-grid" style={{ marginTop: 24 }}>
                <div className="card polished-card">
                    <div className="polished-card-header">
                        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tasks</h3>
                    </div>
                    <div className="polished-card-body">
                        <div
                            className="report-row clickable-row polished-row"
                            onClick={() => navigate('/tasks', { state: { startDate: dateRange.startDate, endDate: dateRange.endDate } })}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="status-dot" style={{ background: 'var(--text-dim)' }} />
                                <span style={{ textTransform: 'capitalize', fontSize: 13, fontWeight: 500 }}>Total</span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{stats.total_tasks || 0}</span>
                        </div>
                        {Object.entries(stats.tasks_by_status || {}).map(([status, count]) => (
                            <div
                                className="report-row clickable-row polished-row"
                                key={status}
                                onClick={() => navigate('/tasks', {
                                    state: {
                                        status: status,
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
                        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization Timesheets</h3>
                    </div>
                    <div className="polished-card-body">
                        <div
                            className="report-row clickable-row polished-row"
                            onClick={() => navigate('/timesheet', { state: { startDate: dateRange.startDate, endDate: dateRange.endDate } })}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="status-dot" style={{ background: 'var(--text-dim)' }} />
                                <span style={{ textTransform: 'capitalize', fontSize: 13, fontWeight: 500 }}>Total</span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>
                                {Object.values(stats.timesheet_tasks_by_status || {}).reduce((a, b) => a + b, 0)}
                            </span>
                        </div>
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

                <div className="card polished-card">
                    <div className="polished-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Milestones</h3>
                        <span style={{ fontSize: 11, background: 'var(--accent-transparent)', color: 'var(--accent-light)', padding: '2px 8px', borderRadius: 10 }}>{overallMilestones?.length || 0} Total</span>
                    </div>
                    <div className="polished-card-body" style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {overallMilestones?.length > 0 ? (
                            overallMilestones.slice(0, 5).map(ms => (
                                <div
                                    key={ms.id}
                                    className="report-row polished-row clickable-row"
                                    style={{ padding: '8px 0', cursor: 'pointer' }}
                                    onClick={() => navigate(`/projects/${ms.project_id || ms.project?.id}`)}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{ms.title}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{ms.project?.name}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: ms.status === 'completed' ? 'var(--success)' : 'var(--warning)' }}>
                                            {ms.status?.toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ms.due_date ? new Date(ms.due_date).toLocaleDateString() : 'No date'}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-dim)', fontSize: 12 }}>No upcoming milestones</div>
                        )}
                    </div>
                </div>

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
            </div>

            <NotificationCard />

            {/* HR Approvals */}
            <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>HR Approvals Needed</h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/hr-admin')}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        Open HR Admin <ArrowRight size={13} />
                    </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button
                        onClick={() => navigate('/hr-admin', { state: { tab: 'attendance' } })}
                        style={{ background: hrStats.pendingAttendance > 0 ? 'var(--warning-bg)' : 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                        <Clock size={20} strokeWidth={2.5} fill="currentColor" style={{ color: hrStats.pendingAttendance > 0 ? 'var(--warning)' : 'var(--text-muted)' }} />
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: hrStats.pendingAttendance > 0 ? 'var(--warning)' : 'var(--text)', lineHeight: 1 }}>{hrStats.pendingAttendance}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Pending Attendance</div>
                        </div>
                    </button>
                    <button
                        onClick={() => navigate('/hr-admin', { state: { tab: 'leaves' } })}
                        style={{ background: hrStats.pendingLeaves > 0 ? 'var(--info-bg)' : 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                        <Calendar size={20} strokeWidth={2.5} fill="currentColor" style={{ color: hrStats.pendingLeaves > 0 ? 'var(--info)' : 'var(--text-muted)' }} />
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: hrStats.pendingLeaves > 0 ? 'var(--info)' : 'var(--text)', lineHeight: 1 }}>{hrStats.pendingLeaves}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Pending Leaves</div>
                        </div>
                    </button>
                </div>
            </div>

            {bdms.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>BDM Performance Overview</h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '24px'
                    }}>
                        {bdms.map(emp => (
                            <EmployeeCard key={emp.id} employee={emp} isAdminView={true} currentRange={dateRange} />
                        ))}
                    </div>
                </div>
            )}

            {testers.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Tester Performance Overview</h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '24px'
                    }}>
                        {testers.map(emp => (
                            <EmployeeCard key={emp.id} employee={emp} isAdminView={true} currentRange={dateRange} />
                        ))}
                    </div>
                </div>
            )}

            {developers.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Developer Performance Overview</h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '24px'
                    }}>
                        {developers.map(emp => (
                            <EmployeeCard key={emp.id} employee={emp} isAdminView={true} currentRange={dateRange} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
