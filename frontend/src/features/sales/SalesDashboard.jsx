import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, DollarSign, Briefcase, Users,
    ArrowUpRight, ArrowDownRight, Target, ChevronRight,
    CalendarClock, PhoneCall, Mail, Presentation, FileText
} from 'lucide-react';
import { SalesService } from './SalesService';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import DateRangePicker from '../../components/DateRangePicker';

/**
 * SalesDashboard — High-level strategic overview of sales pipeline and agent performance.
 */
export default function SalesDashboard() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [overallMetrics, setOverallMetrics] = useState(null);
    const [bdmStats, setBdmStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const userRoles = currentUser?.roles?.map(r => r.toLowerCase()) || [];
    const isAdmin = userRoles.some(r => r.includes('admin') || r.includes('manager') || r.includes('lead'));

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            };

            // 1. Fetch Global Metrics
            const metricsRes = await SalesService.getMetrics(params);
            setOverallMetrics(metricsRes.data);

            // 2. Fetch all BDMs to create individual scorecards
            const agentsRes = await api.get('/users', { params: { role: 'BDM' } });
            const bdms = agentsRes.data.data;

            // 3. Fetch metrics for each BDM
            const bdmData = await Promise.all(bdms.map(async (bdm) => {
                const res = await SalesService.getMetrics({ ...params, assigned_agent_id: bdm.id });
                return {
                    ...bdm,
                    metrics: res.data
                };
            }));

            setBdmStats(bdmData);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatClick = (filterType, filterValue) => {
        // Navigate to leads page with filters
        const params = new URLSearchParams();
        if (filterType === 'status') params.append('status', filterValue);
        if (filterType === 'agent') params.append('agent', filterValue);
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
        navigate(`/leads?${params.toString()}`);
    };

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;

    return (
        <div className="sales-dashboard">
            <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1>Sales Dashboard</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Real-time revenue tracking and BDM performance monitoring.</p>
                </div>
                <DateRangePicker
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    onRangeChange={setDateRange}
                />
            </div>

            {/* Global Metrics Row */}
            <div className="stats-grid" style={{ marginBottom: '40px' }}>
                <div className="card polished-card stat-card-dashboard" onClick={() => handleStatClick('status', 'Proposal')}>
                    <div className="stat-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <Target size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Active Pipeline</label>
                        <h3>${(overallMetrics?.pipelineValue || 0).toLocaleString()}</h3>
                        <div className="stat-footer">
                            <span className="trend positive"><ArrowUpRight size={12} /> {(overallMetrics?.Proposal || 0)} Active Proposals</span>
                        </div>
                    </div>
                </div>

                <div className="card polished-card stat-card-dashboard" onClick={() => handleStatClick('status', 'Won')}>
                    <div className="stat-icon-box" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Won Revenue</label>
                        <h3>${(overallMetrics?.wonValue || 0).toLocaleString()}</h3>
                        <div className="stat-footer">
                            <span className="trend positive"><ArrowUpRight size={12} /> {overallMetrics?.Won || 0} Successful Deals</span>
                        </div>
                    </div>
                </div>

                <div className="card polished-card stat-card-dashboard">
                    <div className="stat-icon-box" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Conversion Rate</label>
                        <h3>{overallMetrics?.total ? Math.round(((overallMetrics?.Won || 0) / overallMetrics.total) * 100) : 0}%</h3>
                        <div className="stat-footer">
                            <span style={{ color: 'var(--text-dim)' }}>From {overallMetrics?.total || 0} Total Leads</span>
                        </div>
                    </div>
                </div>

                <div className="card polished-card stat-card-dashboard">
                    <div className="stat-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <Briefcase size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Total Quotes</label>
                        <h3>{overallMetrics?.quotationCount || 0}</h3>
                        <div className="stat-footer">
                            <span style={{ color: 'var(--text-dim)' }}>Generated Documents</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending Follow-ups Section */}
            {(overallMetrics?.pendingFollowUps?.length > 0) && (
                <div style={{ marginBottom: '40px' }}>
                    <div className="section-header" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CalendarClock size={20} color="var(--warning)" />
                        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Upcoming Callbacks & Follow-ups</h2>
                    </div>
                    <div className="card polished-card" style={{ overflow: 'hidden' }}>
                        <div className="followup-list">
                            {overallMetrics.pendingFollowUps.map(fu => {
                                let Icon = FileText;
                                if (fu.type === 'Call') Icon = PhoneCall;
                                if (fu.type === 'Email') Icon = Mail;
                                if (fu.type === 'Meeting') Icon = Presentation;

                                const isOverdue = new Date(fu.scheduled_at) < new Date();

                                return (
                                    <div
                                        key={fu.id}
                                        className="followup-item clickable-row"
                                        onClick={() => navigate(`/leads?search=${encodeURIComponent(fu.lead?.name || fu.lead?.company || '')}`)}
                                        style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}
                                    >
                                        <div style={{
                                            width: 40, height: 40, borderRadius: '10px',
                                            background: isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                            color: isOverdue ? 'var(--danger)' : 'var(--warning)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                        }}>
                                            <Icon size={20} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                                <div style={{ fontWeight: 600, fontSize: '15px' }}>{fu.lead?.name} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>{fu.lead?.company ? `@ ${fu.lead.company}` : ''}</span></div>
                                                <div style={{
                                                    fontSize: '12px', fontWeight: 600,
                                                    color: isOverdue ? 'var(--danger)' : 'var(--text-dim)',
                                                    background: isOverdue ? 'rgba(239,68,68,0.1)' : 'var(--bg-app)',
                                                    padding: '4px 8px', borderRadius: '4px'
                                                }}>
                                                    {new Date(fu.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                    {isOverdue && ' (Overdue)'}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                                {fu.notes || `Scheduled ${fu.type.toLowerCase()}`}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* BDM Performance Section */}
            <div className="section-header" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Users size={20} color="var(--accent)" />
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>BDM Performance Scorecards</h2>
            </div>

            <div className="bdm-grid">
                {bdmStats.map(bdm => (
                    <div key={bdm.id} className="card polished-card bdm-scorecard" onClick={() => handleStatClick('agent', bdm.id)}>
                        <div className="bdm-header">
                            <div className="bdm-info">
                                <div className="bdm-avatar">{bdm.full_name[0]}</div>
                                <div>
                                    <h4>{bdm.full_name}</h4>
                                    <p>{bdm.email}</p>
                                </div>
                            </div>
                            <ChevronRight size={18} color="var(--text-dim)" />
                        </div>

                        <div className="bdm-metrics">
                            <div className="bdm-stat">
                                <label>Pipeline</label>
                                <span>${(bdm.metrics?.pipelineValue || 0).toLocaleString()}</span>
                            </div>
                            <div className="bdm-stat">
                                <label>Won</label>
                                <span style={{ color: 'var(--success)' }}>${(bdm.metrics?.wonValue || 0).toLocaleString()}</span>
                            </div>
                            <div className="bdm-stat">
                                <label>Conv.</label>
                                <span>{bdm.metrics?.total ? Math.round(((bdm.metrics?.Won || 0) / bdm.metrics.total) * 100) : 0}%</span>
                            </div>
                        </div>

                        <div className="bdm-progress">
                            <div className="progress-label">
                                <span>Targets Achieved</span>
                                <span>{bdm.metrics?.Won || 0} / 10</span>
                            </div>
                            <div className="progress-bar-bg">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${Math.min(((bdm.metrics?.Won || 0) / 10) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 20px;
                }
                .stat-card-dashboard {
                    padding: 24px;
                    display: flex;
                    gap: 20px;
                    align-items: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-bottom: 3px solid transparent;
                }
                .stat-card-dashboard:hover {
                    transform: translateY(-4px);
                    border-bottom-color: var(--accent);
                    background: var(--bg-card-hover);
                }
                .stat-icon-box {
                    width: 56px;
                    height: 56px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .stat-content label {
                    display: block;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-dim);
                    margin-bottom: 4px;
                }
                .stat-content h3 {
                    font-size: 24px;
                    font-weight: 800;
                    margin-bottom: 4px;
                }
                .stat-footer {
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .trend.positive { color: var(--success); display: flex; alignItems: center; gap: 4px; }

                .bdm-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }
                .bdm-scorecard {
                    padding: 24px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .bdm-scorecard:hover {
                    transform: scale(1.02);
                    box-shadow: 0 12px 30px rgba(0,0,0,0.2);
                    border-color: var(--accent);
                }
                .bdm-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                }
                .bdm-info {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }
                .bdm-avatar {
                    width: 44px;
                    height: 44px;
                    background: var(--accent);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 18px;
                }
                .bdm-info h4 { font-size: 16px; font-weight: 700; margin: 0; }
                .bdm-info p { font-size: 12px; color: var(--text-dim); margin: 0; }

                .bdm-metrics {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 24px;
                    padding: 16px;
                    background: var(--bg-app);
                    border-radius: 12px;
                }
                .bdm-stat label {
                    display: block;
                    font-size: 10px;
                    text-transform: uppercase;
                    color: var(--text-dim);
                    margin-bottom: 4px;
                }
                .bdm-stat span {
                    font-size: 14px;
                    font-weight: 700;
                }

                .bdm-progress {
                    margin-top: 16px;
                }
                .progress-label {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    color: var(--text-dim);
                    margin-bottom: 8px;
                }
                .progress-bar-bg {
                    height: 6px;
                    background: var(--bg-app);
                    border-radius: 3px;
                    overflow: hidden;
                }
                .progress-bar-fill {
                    height: 100%;
                    background: var(--accent);
                    border-radius: 3px;
                    transition: width 1s ease-out;
                }
            `}</style>
        </div>
    );
}
