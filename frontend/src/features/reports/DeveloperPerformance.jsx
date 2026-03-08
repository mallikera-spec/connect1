import { useEffect, useState, useMemo } from 'react';
import api from '../../lib/api';
import DateRangePicker from '../../components/DateRangePicker';
import { getISTMonthStartString, getISTTodayString } from '../../lib/dateUtils';
import { BarChart3, XCircle, Target, CheckCircle2, Clock, Zap, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/common/DataTable';

export default function DeveloperPerformance() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    const userRoles = user?.roles?.map(r => typeof r === 'string' ? r.toLowerCase() : r.name?.toLowerCase()).filter(Boolean) || [];
    const isDeveloper = user?.isDeveloper || userRoles.includes('developer');
    const location = useLocation();
    const [dateRange, setDateRange] = useState({
        startDate: location.state?.startDate || getISTMonthStartString(),
        endDate: location.state?.endDate || getISTTodayString()
    });
    const [selectedDevId, setSelectedDevId] = useState(location.state?.devId || (isDeveloper ? user?.id : null));

    const load = () => {
        setLoading(true);
        api.get('/reports/employee-overview', { params: dateRange })
            .then(res => {
                const allDepartments = res.data.data || {};
                const devs = [];
                Object.values(allDepartments).forEach(deptUsers => {
                    deptUsers.forEach(u => {
                        if (u.isDeveloper) {
                            devs.push(u);
                        }
                    });
                });
                setData(devs);
            })
            .catch(err => console.error('Failed to load dev metrics:', err))
            .finally(() => setLoading(false));
    };

    const handleRowClick = (u) => {
        navigate('/timesheet', {
            state: {
                viewUserId: u.id,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            }
        });
    };

    useEffect(() => {
        load();
    }, [dateRange]);

    const filteredData = useMemo(() => {
        if (isDeveloper) {
            return data.filter(u => u.id === user?.id);
        }
        return selectedDevId ? data.filter(u => u.id === selectedDevId) : data;
    }, [data, selectedDevId, isDeveloper, user?.id]);

    const metrics = useMemo(() => {
        if (filteredData.length === 0) return { completed: 0, hours: 0, audited: 0, pending: 0, passRate: 0, avgEfficiency: 0 };

        const totalCompleted = filteredData.reduce((sum, u) => sum + (u.metrics?.completed_items || 0), 0);
        const totalAudited = filteredData.reduce((sum, u) => sum + (u.metrics?.audited_items || 0), 0);
        const totalPending = filteredData.reduce((sum, u) => sum + (u.metrics?.pending_qa_items || 0), 0);
        const totalHours = filteredData.reduce((sum, u) => sum + (u.total_hours || 0), 0);

        const avgPassRate = filteredData.reduce((s, u) => s + (u.metrics?.qa_pass_rate || 0), 0) / filteredData.length;
        const avgEfficiency = filteredData.reduce((s, u) => s + (u.metrics?.efficiency || 0), 0) / filteredData.length;

        return { completed: totalCompleted, hours: totalHours, audited: totalAudited, pending: totalPending, passRate: avgPassRate, efficiency: avgEfficiency };
    }, [filteredData]);

    const dailyStats = useMemo(() => {
        const stats = {};

        // Initialize all dates in the selected range to 0
        if (dateRange.startDate && dateRange.endDate) {
            let current = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);
            let safety = 0; // Prevent infinite loops
            while (current <= end && safety < 100) {
                const dateStr = current.toISOString().slice(0, 10);
                stats[dateStr] = { hours: 0, verified: 0 };
                current.setDate(current.getDate() + 1);
                safety++;
            }
        }

        filteredData.forEach(u => {
            (u.daily_metrics || []).forEach(d => {
                if (!stats[d.date]) stats[d.date] = { hours: 0, verified: 0 };
                stats[d.date].hours += d.hours;
                stats[d.date].verified += d.verified;
            });
        });
        return Object.entries(stats).map(([date, vals]) => ({ date, ...vals })).sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredData, dateRange]);

    const renderBarChart = (data, key, color, label) => {
        if (data.length === 0) return null;
        const maxVal = Math.max(...data.map(d => d[key]), 1) * 1.2; // Add 20% headroom

        // Generate Y-axis ticks (4 intervals)
        const ticks = [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0];

        return (
            <div className="card polished-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{label}</h3>
                </div>

                <div style={{ display: 'flex', height: 200, paddingBottom: 24 }}>
                    {/* Y-Axis */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: 12, borderRight: '1px solid var(--border)', width: 40, textAlign: 'right', color: 'var(--text-dim)', fontSize: 11 }}>
                        {ticks.map((t, i) => (
                            <div key={i} style={{ transform: 'translateY(50%)' }}>{t > 0 ? t.toFixed(1) : '0'}</div>
                        ))}
                    </div>

                    {/* Chart Area */}
                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end', marginLeft: 12, gap: 8 }}>
                        {/* Horizontal Grid Lines */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 0, pointerEvents: 'none' }}>
                            {ticks.slice(0, 4).map((_, i) => (
                                <div key={i} style={{ borderTop: '1px dashed var(--border)', opacity: 0.5, width: '100%' }} />
                            ))}
                            <div style={{ borderTop: '1px solid var(--border)', width: '100%' }} />
                        </div>

                        {/* Bars & X-Axis */}
                        {data.map((d, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative', zIndex: 1 }}>

                                {/* Data Label */}
                                {d[key] > 0 && (
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4 }}>
                                        {Number(d[key]).toFixed(key === 'verified' && d[key] % 1 === 0 ? 0 : 1)}
                                    </div>
                                )}

                                <div
                                    style={{
                                        width: '100%',
                                        maxWidth: '40px',
                                        background: `linear-gradient(to top, ${color}cc, ${color})`,
                                        height: `${(d[key] / maxVal) * 100}%`,
                                        borderRadius: '4px 4px 0 0',
                                        transition: 'height 0.3s ease',
                                    }}
                                    title={`${d.date}: ${Number(d[key]).toFixed(1)}`}
                                />

                                {/* X-Axis Label */}
                                <div style={{
                                    fontSize: 10,
                                    color: 'var(--text-dim)',
                                    position: 'absolute',
                                    bottom: -24,
                                    whiteSpace: 'nowrap',
                                    transform: 'translateX(-50%) rotate(-45deg)',
                                    left: '50%'
                                }}>
                                    {d.date.split('-').slice(1).join('/')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    if (loading && data.length === 0) return <div className="page-loader"><div className="spinner" /></div>;

    return (
        <div style={{ padding: '2px' }}>
            <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Zap className="text-accent" />
                        {isDeveloper ? 'My Performance Analytics' : 'Developer Performance Matrix'}
                    </h1>
                    <p style={{ color: 'var(--text-dim)', marginTop: 4 }}>
                        Tracking technical delivery quality, audit status, and delivery efficiency.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {!isDeveloper && (
                        <select
                            className="form-select"
                            value={selectedDevId || ''}
                            onChange={(e) => setSelectedDevId(e.target.value || null)}
                            style={{ width: '220px', height: '42px' }}
                        >
                            <option value="">All Developers</option>
                            {data.map(u => (
                                <option key={u.id} value={u.id}>{u.full_name}</option>
                            ))}
                        </select>
                    )}
                    <DateRangePicker
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        onRangeChange={setDateRange}
                    />
                </div>
            </div>

            {selectedDevId && (
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--accent-transparent)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--accent-light)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-light)' }}>
                        Filtered by: {filteredData[0]?.full_name || 'Selected Developer'}
                    </div>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedDevId(null)}
                        style={{ padding: '2px 8px', height: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-dim)' }}
                    >
                        <XCircle size={14} /> Clear Filter
                    </button>
                </div>
            )}

            <div className="stats-grid" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Completed', value: metrics.completed, icon: CheckCircle2, color: '#3b82f6', filter: 'completed' },
                    { label: 'Audited (Pass/Fail)', value: metrics.audited, icon: ShieldCheck, color: '#10b981', filter: 'audited' },
                    { label: 'Pending QA', value: metrics.pending, icon: Clock, color: '#f59e0b', filter: 'pending_qa' },
                    { label: 'Audit Accuracy', value: `${metrics.passRate.toFixed(1)}%`, icon: Target, color: metrics.passRate > 80 ? '#10b981' : '#ef4444' },
                ].map(s => (
                    <div
                        key={s.label}
                        className="card polished-card"
                        style={{
                            padding: '20px',
                            cursor: s.filter ? 'pointer' : 'default',
                            transition: 'transform 0.2s',
                            border: '1px solid transparent'
                        }}
                        onClick={() => {
                            if (s.filter) {
                                navigate('/timesheet', {
                                    state: {
                                        viewUserId: selectedDevId || null,
                                        statusFilter: s.filter,
                                        startDate: dateRange.startDate,
                                        endDate: dateRange.endDate
                                    }
                                });
                            }
                        }}
                        onMouseOver={(e) => { if (s.filter) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseOut={(e) => { if (s.filter) e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{s.value}</div>
                            </div>
                            <div style={{ background: `${s.color}20`, padding: 10, borderRadius: 10 }}>
                                <s.icon size={20} color={s.color} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                {renderBarChart(dailyStats, 'hours', '#6366f1', 'Daily Work Hours')}
                {renderBarChart(dailyStats, 'verified', '#3b82f6', 'Daily Verified Tasks/Todos')}
            </div>

            <div className="card polished-card" style={{ padding: 0 }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>Engineering Excellence Matrix</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{filteredData.length} Developers Tracked</div>
                </div>
                <DataTable
                    data={filteredData}
                    fileName="developer-performance"
                    loading={loading}
                    onRowClick={handleRowClick}
                    columns={[
                        {
                            label: 'Developer',
                            key: 'full_name',
                            render: (val, u) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {u.avatar_url ? (
                                        <img src={u.avatar_url} alt={u.full_name} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                                    ) : (
                                        <div className="user-avatar" style={{ width: 36, height: 36, fontSize: 11, margin: 0 }}>{u.full_name?.slice(0, 2).toUpperCase()}</div>
                                    )}
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{u.full_name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{u.designation}</div>
                                    </div>
                                </div>
                            )
                        },
                        {
                            label: 'Completed',
                            key: 'metrics.completed_items',
                            render: (val) => <div style={{ textAlign: 'center', fontWeight: 600 }}>{val}</div>
                        },
                        {
                            label: 'Audited',
                            key: 'metrics.audited_items',
                            render: (val) => <div style={{ textAlign: 'center' }}>{val}</div>
                        },
                        {
                            label: 'Pending QA',
                            key: 'metrics.pending_qa_items',
                            render: (val) => (
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ color: val > 0 ? 'var(--warning)' : 'var(--text-dim)' }}>{val}</span>
                                </div>
                            )
                        },
                        {
                            label: 'Accuracy (Pass %)',
                            key: 'metrics.qa_pass_rate',
                            render: (val) => (
                                <div style={{ textAlign: 'center' }}>
                                    <span className={`badge ${val > 80 ? 'badge-green' : val > 60 ? 'badge-yellow' : 'badge-red'}`}>
                                        {(val || 0).toFixed(1)}%
                                    </span>
                                </div>
                            )
                        },
                        {
                            label: 'Efficiency (Items/Hr)',
                            key: 'metrics.efficiency',
                            render: (val) => (
                                <div style={{ textAlign: 'center', fontWeight: 600, color: 'var(--accent)' }}>
                                    {(val || 0).toFixed(2)}
                                </div>
                            )
                        },
                        {
                            label: 'Score',
                            key: 'metrics.performance_score',
                            render: (val) => (
                                <div style={{ textAlign: 'center', fontWeight: 800, color: 'var(--accent)' }}>
                                    {(val || 0).toFixed(1)}
                                </div>
                            )
                        }
                    ]}
                />
            </div>
        </div>
    );
}
