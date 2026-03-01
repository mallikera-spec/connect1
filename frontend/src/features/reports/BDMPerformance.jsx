import { useEffect, useState } from 'react';
import api from '../../lib/api';
import DateRangePicker from '../../components/DateRangePicker';
import { getISTMonthStartString, getISTTodayString } from '../../lib/dateUtils';
import { BarChart3, ArrowUpRight, XCircle, Target, Award, TrendingUp, Percent } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BDMPerformance() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const [dateRange, setDateRange] = useState({
        startDate: location.state?.startDate || getISTMonthStartString(),
        endDate: location.state?.endDate || getISTTodayString()
    });
    const [selectedAgentId, setSelectedAgentId] = useState(location.state?.agentId || null);

    const load = () => {
        setLoading(true);
        api.get('/reports/employee-overview', { params: dateRange })
            .then(res => {
                const allDepartments = res.data.data || {};
                const bdms = [];
                Object.values(allDepartments).forEach(deptUsers => {
                    deptUsers.forEach(user => {
                        if (user.sales_stats) {
                            bdms.push(user);
                        }
                    });
                });
                setData(bdms);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [dateRange]);

    const filteredData = selectedAgentId
        ? data.filter(u => u.id === selectedAgentId)
        : data;

    if (loading && data.length === 0) return <div className="page-loader"><div className="spinner" /></div>;

    const aggregateTotal = (key) => filteredData.reduce((sum, u) => sum + (u.sales_stats?.[key] || 0), 0);
    const totalLeads = aggregateTotal('total_leads');
    const totalWonValue = aggregateTotal('won_value');
    const totalPipeline = aggregateTotal('pipeline_value');
    const totalWonCount = aggregateTotal('won_count');
    const avgConvRate = totalLeads > 0 ? (totalWonCount / totalLeads) * 100 : 0;

    return (
        <div style={{ padding: '2px' }}>
            <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <BarChart3 className="text-accent" />
                        BDM Performance Review
                    </h1>
                    <p style={{ color: 'var(--text-dim)', marginTop: 4 }}>Analyzing sales conversion, pipeline, and lead closure metrics</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <select
                        className="form-select"
                        value={selectedAgentId || ''}
                        onChange={(e) => setSelectedAgentId(e.target.value || null)}
                        style={{ width: '200px', height: '42px' }}
                    >
                        <option value="">All BDMs</option>
                        {data.map(u => (
                            <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                    </select>
                    <DateRangePicker
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        onRangeChange={setDateRange}
                    />
                </div>
            </div>

            {selectedAgentId && (
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--accent-transparent)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--accent-light)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-light)' }}>
                        Filtered by: {filteredData[0]?.full_name || 'Selected Agent'}
                    </div>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedAgentId(null)}
                        style={{ padding: '2px 8px', height: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-dim)' }}
                    >
                        <XCircle size={14} /> Clear Filter
                    </button>
                </div>
            )}

            <div className="stats-grid" style={{ marginBottom: 32 }}>
                {[
                    { label: 'Total Leads', value: totalLeads, icon: Target, color: '#3b82f6' },
                    { label: 'Won Value', value: `₹${(totalWonValue / 100000).toFixed(2)}L`, icon: Award, color: '#10b981' },
                    { label: 'Pipeline', value: `₹${(totalPipeline / 100000).toFixed(2)}L`, icon: TrendingUp, color: '#8b5cf6' },
                    { label: 'Avg Conv. %', value: `${avgConvRate.toFixed(1)}%`, icon: Percent, color: '#f59e0b' },
                ].map(s => (
                    <div key={s.label} className="card polished-card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{s.value}</div>
                            </div>
                            <div style={{ background: `${s.color}20`, padding: 12, borderRadius: 12 }}>
                                <s.icon size={24} color={s.color} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card polished-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>Individual Performance Matrix</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{data.length} BDMs Tracked</div>
                </div>
                <div className="table-wrapper">
                    <table className="polished-table">
                        <thead>
                            <tr>
                                <th>BDM / Agent</th>
                                <th style={{ textAlign: 'center' }}>Leads</th>
                                <th style={{ textAlign: 'center' }}>Pipeline Value</th>
                                <th style={{ textAlign: 'center' }}>Won Value</th>
                                <th style={{ textAlign: 'center' }}>Quotations</th>
                                <th style={{ textAlign: 'center' }}>Conv. %</th>
                                <th style={{ textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            {u.avatar_url ? (
                                                <img src={u.avatar_url} alt={u.full_name} style={{ width: 32, height: 32, borderRadius: '50%' }} />
                                            ) : (
                                                <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 10, margin: 0 }}>{u.full_name?.slice(0, 2).toUpperCase()}</div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>{u.full_name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{u.designation}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{u.sales_stats.total_leads}</td>
                                    <td style={{ textAlign: 'center' }}>₹{(u.sales_stats.pipeline_value / 1000).toFixed(1)}k</td>
                                    <td style={{ textAlign: 'center', color: 'var(--success)', fontWeight: 700 }}>₹{(u.sales_stats.won_value / 1000).toFixed(1)}k</td>
                                    <td style={{ textAlign: 'center' }}>{u.sales_stats.quotation_count}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'inline-block', background: u.sales_stats.conversion_rate > 15 ? 'var(--success-bg)' : 'var(--warning-bg)', color: u.sales_stats.conversion_rate > 15 ? 'var(--success)' : 'var(--warning)', padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                                            {u.sales_stats.conversion_rate.toFixed(1)}%
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => navigate('/leads', { state: { agent: u.id, ...dateRange } })}
                                            style={{ color: 'var(--accent-light)' }}
                                        >
                                            View Leads <ArrowUpRight size={14} style={{ marginLeft: 4 }} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
