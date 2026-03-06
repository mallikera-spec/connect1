import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, Users,
    ArrowUpRight, Target, ChevronRight,
    CalendarClock, PhoneCall, Mail, Presentation, FileText,
    IndianRupee
} from 'lucide-react';
import { SalesService } from '../sales/SalesService';
import { useAuth } from '../../context/AuthContext';
import { EmployeeCard, AttendanceWidget } from './DashboardComponents';

/**
 * BDMDashboard — Specialized view for Business Development Managers.
 */
export default function BDMDashboard({ dateRange }) {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser?.id) {
            fetchData();
        }
    }, [dateRange, currentUser?.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                agentId: currentUser.id // Filter metrics for this BDM specifically
            };

            const metricsRes = await SalesService.getMetrics(params);
            setMetrics(metricsRes.data);
        } catch (err) {
            console.error('Failed to fetch BDM dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatClick = (status = '') => {
        navigate('/leads', {
            state: {
                agent: currentUser.id,
                status,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            }
        });
    };

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;

    return (
        <div className="bdm-dashboard">
            {/* Summary Metrics Row */}
            <div className="stats-grid" style={{ marginBottom: '40px' }}>
                <AttendanceWidget />

                <div className="card polished-card stat-card-dashboard" onClick={() => handleStatClick('status', 'Proposal')}>
                    <div className="stat-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <Target size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Your Pipeline</label>
                        <h3>Rs {(metrics?.pipelineValue || 0).toLocaleString()}</h3>
                        <div className="stat-footer">
                            <span className="trend positive"><ArrowUpRight size={12} /> {(metrics?.Proposal || 0)} Proposals</span>
                        </div>
                    </div>
                </div>

                <div className="card polished-card stat-card-dashboard" onClick={() => handleStatClick('status', 'Won')}>
                    <div className="stat-icon-box" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                        <IndianRupee size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Revenue Generated</label>
                        <h3>Rs {(metrics?.wonValue || 0).toLocaleString()}</h3>
                        <div className="stat-footer">
                            <span className="trend positive"><ArrowUpRight size={12} /> {metrics?.Won || 0} Deals Won</span>
                        </div>
                    </div>
                </div>

                <div className="card polished-card stat-card-dashboard">
                    <div className="stat-icon-box" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Conversion</label>
                        <h3>{metrics?.total ? Math.round(((metrics?.Won || 0) / metrics.total) * 100) : 0}%</h3>
                        <div className="stat-footer">
                            <span style={{ color: 'var(--text-dim)' }}>From {metrics?.total || 0} Leads</span>
                        </div>
                    </div>
                </div>

                <div className="card polished-card stat-card-dashboard">
                    <div className="stat-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <Target size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Monthly Target</label>
                        <h3>Rs {(metrics?.monthlyTarget || 0).toLocaleString()}</h3>
                        <div className="stat-footer">
                            <span style={{ color: 'var(--text-dim)' }}>15x base salary</span>
                        </div>
                    </div>
                </div>

                <div className="card polished-card stat-card-dashboard">
                    <div className="stat-icon-box" style={{
                        background: (metrics?.variance || 0) >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: (metrics?.variance || 0) >= 0 ? '#22c55e' : '#ef4444'
                    }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Variance</label>
                        <h3 style={{ color: (metrics?.variance || 0) >= 0 ? 'var(--success)' : '#ef4444' }}>
                            {(metrics?.variance || 0) >= 0 ? '+' : ''} Rs {(metrics?.variance || 0).toLocaleString()}
                        </h3>
                        <div className="stat-footer">
                            <span style={{ color: 'var(--text-dim)' }}>vs Target</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-main-layout">
                {/* Left Side: Callbacks & Follow-ups */}
                <div>
                    <div className="section-header" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <CalendarClock size={20} color="var(--warning)" />
                            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>My Upcoming Callbacks</h2>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/follow-ups')} style={{ color: 'var(--accent)' }}>
                            View All <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="card polished-card" style={{ minHeight: '300px' }}>
                        {metrics?.pendingFollowUps?.length > 0 ? (
                            <div className="followup-list">
                                {metrics.pendingFollowUps.slice(0, 5).map(fu => {
                                    let Icon = FileText;
                                    if (fu.type === 'Call' || fu.type === 'Callback') Icon = PhoneCall;
                                    if (fu.type === 'Email') Icon = Mail;
                                    if (fu.type === 'Meeting') Icon = Presentation;

                                    const isOverdue = new Date(fu.scheduled_at) < new Date();

                                    return (
                                        <div
                                            key={fu.id}
                                            className="followup-item clickable-row"
                                            onClick={() => navigate('/leads', { state: { leadId: fu.lead?.id } })}
                                            style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}
                                        >
                                            <div style={{
                                                width: 40, height: 40, borderRadius: '10px',
                                                background: isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(124,58,237,0.1)',
                                                color: isOverdue ? 'var(--danger)' : 'var(--accent-light)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                            }}>
                                                <Icon size={18} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{fu.lead?.name}</div>
                                                    <div style={{
                                                        fontSize: '11px', fontWeight: 600,
                                                        color: isOverdue ? 'var(--danger)' : 'var(--text-muted)',
                                                        background: isOverdue ? 'rgba(239,68,68,0.1)' : 'var(--bg-app)',
                                                        padding: '4px 8px', borderRadius: '4px'
                                                    }}>
                                                        {new Date(fu.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-dim)', opacity: 0.8 }}>
                                                    {fu.notes || `Scheduled ${fu.type.toLowerCase()}`}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', opacity: 0.5 }}>
                                <CalendarClock size={48} style={{ marginBottom: '16px' }} />
                                <p>No pending follow-ups scheduled.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Personal Performance Card */}
                <div>
                    <div className="section-header" style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <TrendingUp size={20} color="var(--accent)" />
                            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>My Performance</h2>
                        </div>
                    </div>
                    {/* Re-using EmployeeCard for the BDM themselves */}
                    <EmployeeCard
                        employee={{
                            ...currentUser,
                            sales_stats: metrics ? {
                                total_leads: metrics.total,
                                pipeline_value: metrics.pipelineValue,
                                won_value: metrics.wonValue,
                                conversion_rate: metrics.total ? ((metrics.Won || 0) / metrics.total) * 100 : 0
                            } : null
                        }}
                        isAdminView={false} // This will show personal metrics
                        currentRange={dateRange}
                    />
                </div>
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
                    gap: 16px;
                    align-items: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .stat-card-dashboard:hover {
                    transform: translateY(-4px);
                    background: var(--bg-card-hover);
                }
                .stat-icon-box {
                    width: 52px;
                    height: 52px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .stat-content label {
                    display: block;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-dim);
                    margin-bottom: 2px;
                    letter-spacing: 0.05em;
                }
                .stat-content h3 {
                    font-size: 22px;
                    font-weight: 800;
                    margin: 0;
                }
                .stat-footer {
                    font-size: 11px;
                    margin-top: 4px;
                }
                .trend.positive { color: var(--success); display: flex; align-items: center; gap: 4px; }
            `}</style>
        </div >
    );
}
