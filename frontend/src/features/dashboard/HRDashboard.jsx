import { useEffect, useState } from 'react';
import { Users, Building2, UserPlus } from 'lucide-react';
import api from '../../lib/api';
import { StatCard, NotificationCard } from './DashboardComponents';

export default function HRDashboard({ dateRange }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params = { startDate: dateRange.startDate, endDate: dateRange.endDate };

        api.get('/reports/hr-overview', { params })
            .then((res) => setStats(res.data.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [dateRange]);

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;
    if (!stats) return null;

    return (
        <div>
            <div className="stats-grid">
                <StatCard
                    icon={Users}
                    label="Total Employees"
                    value={stats.total_employees}
                    color="rgba(79,70,229,0.25)"
                    to="/users"
                />
                <StatCard
                    icon={Building2}
                    label="Active Departments"
                    value={stats.total_departments}
                    color="rgba(59,130,246,0.25)"
                    to="/departments"
                />
                <StatCard
                    icon={UserPlus}
                    label="Recent Hires (30d)"
                    value={stats.recent_hires?.length || 0}
                    color="rgba(34,197,94,0.25)"
                    to="/users"
                />
            </div>

            <div style={{ marginTop: '24px' }}>
                <NotificationCard />
            </div>

            <div className="card polished-card" style={{ marginTop: '24px' }}>
                <div className="polished-card-header">
                    <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Hires</h3>
                </div>
                <div className="polished-card-body">
                    {stats.recent_hires?.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', padding: '16px' }}>
                            {stats.recent_hires.map(emp => (
                                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-app)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    {emp.avatar_url ? (
                                        <img src={emp.avatar_url} alt={emp.full_name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="user-avatar" style={{ margin: 0, width: 40, height: 40 }}>{emp.full_name?.slice(0, 2).toUpperCase()}</div>
                                    )}
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{emp.full_name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{emp.designation || 'Specialist'} • {emp.department || 'No Dept'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)' }}>
                            No new hires in the last 30 days.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
