import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, IndianRupee, Briefcase, Users,
    ArrowUpRight, ArrowDownRight, Target, ChevronRight,
    CalendarClock, PhoneCall, Mail, Presentation, FileText
} from 'lucide-react';
import { SalesService } from './SalesService';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import DateRangePicker from '../../components/DateRangePicker';
import { getISTMonthStartString, getISTTodayString } from '../../lib/dateUtils';
import { EmployeeCard, AttendanceWidget } from '../dashboard/DashboardComponents';
import LeadDetailsModal from './LeadDetailsModal';

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
        startDate: getISTMonthStartString(),
        endDate: getISTTodayString()
    });
    const [selectedLeadId, setSelectedLeadId] = useState(null);

    const userRoles = currentUser?.roles?.map(r => typeof r === 'string' ? r.toLowerCase() : r.name?.toLowerCase()).filter(Boolean) || [];
    const isAdmin = userRoles.some(r => r && (r.includes('admin') || r.includes('manager') || r.includes('lead')));

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

            // 2. Fetch Employee Overview (includes pre-aggregated BDM stats)
            const overviewRes = await api.get('/reports/employee-overview', { params });
            const allDeptData = overviewRes.data.data || {};

            // Extract all BDMs from all departments
            const bdms = [];
            Object.values(allDeptData).forEach(users => {
                users.forEach(u => {
                    if (u.sales_stats) bdms.push(u);
                });
            });

            setBdmStats(bdms);
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
                <AttendanceWidget />
                <div className="card polished-card stat-card-dashboard" onClick={() => handleStatClick('status', 'Proposal')}>
                    <div className="stat-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <Target size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Active Pipeline</label>
                        <h3>Rs {(overallMetrics?.pipelineValue || 0).toLocaleString()}</h3>
                        <div className="stat-footer">
                            <span className="trend positive"><ArrowUpRight size={12} /> {(overallMetrics?.Proposal || 0)} Active Proposals</span>
                        </div>
                    </div>
                </div>

                <div className="card polished-card stat-card-dashboard" onClick={() => handleStatClick('status', 'Won')}>
                    <div className="stat-icon-box" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                        <IndianRupee size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Won Revenue</label>
                        <h3>Rs {(overallMetrics?.wonValue || 0).toLocaleString()}</h3>
                        <div className="stat-footer">
                            <span className="trend positive"><ArrowUpRight size={12} /> {overallMetrics?.Won || 0} Successful Deals</span>
                        </div>
                    </div>
                </div>

                <div className="card polished-card stat-card-dashboard" onClick={() => handleStatClick('status', 'Won')}>
                    <div className="stat-icon-box" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Conversion Rate</label>
                        <h3>{(overallMetrics?.conversionRate || 0).toFixed(1)}%</h3>
                        <div className="stat-footer">
                            <span style={{ color: 'var(--text-dim)' }}>From {overallMetrics?.total || 0} Total Leads</span>
                        </div>
                    </div>
                </div>

                <div className="card polished-card stat-card-dashboard" onClick={() => navigate('/leads')}>
                    <div className="stat-icon-box" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Total Leads</label>
                        <h3>{overallMetrics?.total || 0}</h3>
                        <div className="stat-footer">
                            <span style={{ color: 'var(--text-dim)' }}>In Sales Database</span>
                        </div>
                    </div>
                </div>

                <div className="card polished-card stat-card-dashboard" onClick={() => handleStatClick('status', 'Proposal,Meeting,Negotiation,Won')}>
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

                {/* Target vs Achieved for BDM Dashboard */}
                {bdmStats.length === 1 && (
                    <>
                        <div className="card polished-card stat-card-dashboard" style={{ borderBottomColor: 'var(--accent)' }} onClick={() => handleStatClick('agent', bdmStats[0].id)}>
                            <div className="stat-icon-box" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                                <Target size={24} />
                            </div>
                            <div className="stat-content">
                                <label>Period Target</label>
                                <h3>Rs {(bdmStats[0]?.sales_stats?.monthly_target || 0).toLocaleString()}</h3>
                                <div className="stat-footer">
                                    <span style={{ color: 'var(--text-dim)' }}>Target for selected period</span>
                                </div>
                            </div>
                        </div>

                        <div className="card polished-card stat-card-dashboard" style={{ borderBottomColor: (bdmStats[0]?.sales_stats?.variance || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }} onClick={() => handleStatClick('status', 'Won')}>
                            <div className="stat-icon-box" style={{
                                background: (bdmStats[0]?.sales_stats?.variance || 0) >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: (bdmStats[0]?.sales_stats?.variance || 0) >= 0 ? 'var(--success)' : 'var(--danger)'
                            }}>
                                {(bdmStats[0]?.sales_stats?.variance || 0) >= 0 ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                            </div>
                            <div className="stat-content">
                                <label>Target Variance</label>
                                <h3 style={{ color: (bdmStats[0]?.sales_stats?.variance || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                    {(bdmStats[0]?.sales_stats?.variance || 0) >= 0 ? '+' : ''}
                                    Rs {Math.abs(bdmStats[0]?.sales_stats?.variance || 0).toLocaleString()}
                                </h3>
                                <div className="stat-footer">
                                    <span style={{ color: 'var(--text-dim)' }}>Performance against target</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Pending Follow-ups Section */}
            {(overallMetrics?.pendingFollowUps?.length > 0) && (
                <div style={{ marginBottom: '40px' }}>
                    <div className="section-header" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <CalendarClock size={20} color="var(--warning)" />
                            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Upcoming Callbacks & Follow-ups</h2>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/follow-ups')} style={{ color: 'var(--accent)' }}>
                            View All <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="card polished-card" style={{ overflow: 'hidden' }}>
                        <div className="followup-list">
                            {overallMetrics.pendingFollowUps.map(fu => {
                                let Icon = FileText;
                                if (fu.type === 'Call' || fu.type === 'Callback') Icon = PhoneCall;
                                if (fu.type === 'Email') Icon = Mail;
                                if (fu.type === 'Meeting') Icon = Presentation;

                                const isOverdue = new Date(fu.scheduled_at) < new Date();

                                return (
                                    <div
                                        key={fu.id}
                                        className="followup-item clickable-row"
                                        onClick={() => setSelectedLeadId(fu.lead?.id)}
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
                                                <div style={{ fontWeight: 600, fontSize: '15px' }}>
                                                    {fu.lead?.name}
                                                    <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>{fu.lead?.company ? ` @ ${fu.lead.company}` : ''}</span>
                                                    {fu.lead?.phone && <span style={{ color: 'var(--accent-light)', marginLeft: '8px', fontSize: '13px' }}>• {fu.lead.phone}</span>}
                                                </div>
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

            {/* Interaction Feeds Section */}
            <div style={{ marginBottom: '40px' }}>
                <div className="section-header" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ArrowUpRight size={20} color="var(--success)" />
                        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Recent Interaction Logs</h2>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/interaction-history')} style={{ color: 'var(--accent)' }}>
                        View Full History <ChevronRight size={14} />
                    </button>
                </div>
                <div className="card polished-card" style={{ overflow: 'hidden' }}>
                    <div className="interaction-feed-list">
                        {overallMetrics?.recentInteractions?.length > 0 ? overallMetrics.recentInteractions.map(it => {
                            let Icon = FileText;
                            if (it.type === 'Call' || it.type === 'Callback') Icon = PhoneCall;
                            if (it.type === 'Email') Icon = Mail;
                            if (it.type === 'Meeting') Icon = Presentation;
                            if (it.type === 'Note') Icon = FileText;

                            return (
                                <div
                                    key={it.id}
                                    className="interaction-feed-item clickable-row"
                                    onClick={() => setSelectedLeadId(it.lead?.id)}
                                    style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}
                                >
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '8px',
                                        background: 'rgba(124, 58, 237, 0.1)',
                                        color: 'var(--accent)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <Icon size={18} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                            <div style={{ fontWeight: 600, fontSize: '14px' }}>
                                                {it.lead?.name} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>{it.lead?.company ? `@ ${it.lead.company}` : ''}</span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                                                {new Date(it.completed_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                            {it.notes || `Interaction: ${it.type}`}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800 }}>
                                                {it.agent?.full_name?.charAt(0)}
                                            </div>
                                            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Performed by <strong>{it.agent?.full_name}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '14px' }}>
                                No recent interactions recorded.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BDM Performance Section */}
            <div className="section-header" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Users size={20} color="var(--accent)" />
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>BDM Performance Scorecards</h2>
            </div>

            <div className="bdm-grid">
                {bdmStats.map(bdm => (
                    <div
                        key={bdm.id}
                        className="card polished-card"
                        style={{ padding: '20px', cursor: 'pointer' }}
                        onClick={() => navigate('/bdm-performance', { state: { agentId: bdm.id, ...dateRange } })}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            {bdm.avatar_url ? (
                                <img src={bdm.avatar_url} alt={bdm.full_name} style={{ width: 64, height: 64, borderRadius: '50%' }} />
                            ) : (
                                <div className="user-avatar" style={{ width: 64, height: 64, fontSize: 24, margin: 0 }}>{bdm.full_name?.slice(0, 2).toUpperCase()}</div>
                            )}
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '16px' }}>{bdm.full_name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{bdm.designation}</div>
                            </div>
                        </div>
                        <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Target</div>
                                <div style={{ fontSize: '14px', fontWeight: 700 }}>₹{(bdm.sales_stats?.monthly_target / 1000).toFixed(0)}k</div>
                            </div>
                            <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Achieved</div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)' }}>₹{(bdm.sales_stats?.won_value / 1000).toFixed(0)}k</div>
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
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 24px;
                }
                .interaction-feed-item.clickable-row {
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .interaction-feed-item.clickable-row:hover {
                    background: var(--bg-hover);
                }
            `}</style>

            {selectedLeadId && (
                <LeadDetailsModal
                    leadId={selectedLeadId}
                    onClose={() => setSelectedLeadId(null)}
                    onSaved={fetchData}
                />
            )}
        </div>
    );
}
