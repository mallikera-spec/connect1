import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { EmployeeCard } from './DashboardComponents';

export default function AdminDashboard({ dateRange }) {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [employeeOverview, setEmployeeOverview] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params = { startDate: dateRange.startDate, endDate: dateRange.endDate };

        Promise.all([
            api.get('/reports/overall', { params }),
            api.get('/reports/employee-overview', { params })
        ])
            .then(([res1, res2]) => {
                setStats(res1.data.data);
                if (res2) setEmployeeOverview(res2.data.data);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [dateRange]);

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;
    if (!stats) return null;

    return (
        <div>
            <div className="dashboard-grid">
                <div className="card polished-card">
                    <div className="polished-card-header">
                        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization Projects</h3>
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
                        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization Timesheets</h3>
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

            {employeeOverview && (
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
                                    <EmployeeCard key={emp.id} employee={emp} isAdminView={true} currentRange={dateRange} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
