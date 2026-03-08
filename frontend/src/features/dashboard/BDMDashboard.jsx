import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, Users,
    ArrowUpRight, Target, ChevronRight,
    CalendarClock, PhoneCall, Mail, Presentation, FileText,
    IndianRupee, AlertCircle, Clock
} from 'lucide-react';
import { SalesService } from '../sales/SalesService';
import { useAuth } from '../../context/AuthContext';
import { EmployeeCard, AttendanceWidget } from './DashboardComponents';
import LeadDetailsModal from '../sales/LeadDetailsModal';

/**
 * BDMDashboard — Specialized view for Business Development Managers.
 */
export default function BDMDashboard({ dateRange }) {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedLeadId, setSelectedLeadId] = useState(null);

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

                <div className="card polished-card stat-card-dashboard" onClick={() => handleStatClick('Proposal')}>
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

                <div className="card polished-card stat-card-dashboard" onClick={() => handleStatClick('Won')}>
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

                <div className="card polished-card stat-card-dashboard" onClick={() => handleStatClick('Won')}>
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

                {/* Target vs Achievement Progress Card */}
                <div className="card polished-card stat-card-dashboard" onClick={() => handleStatClick('Won')}>
                    <div className="stat-icon-box" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        <Target size={24} />
                    </div>
                    <div className="stat-content" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: 8 }}>
                            <div>
                                <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>Revenue vs Target</label>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                    <span style={{ fontSize: 22, fontWeight: 800 }}>₹{(metrics?.wonValue || 0).toLocaleString()}</span>
                                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>/ ₹{(metrics?.monthlyTarget || 0).toLocaleString()}</span>
                                </h3>
                            </div>
                            <div style={{
                                background: (metrics?.variance || 0) >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: (metrics?.variance || 0) >= 0 ? '#22c55e' : '#ef4444',
                                padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, display: 'inline-block'
                            }}>
                                {(metrics?.variance || 0) >= 0 ? '+' : '-'} ₹{Math.abs(metrics?.variance || 0).toLocaleString()}
                            </div>
                        </div>

                        {/* Progress Bar Container */}
                        <div style={{ width: '100%', height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                            {(() => {
                                const target = metrics?.monthlyTarget || 1;
                                const achieved = metrics?.wonValue || 0;
                                let percentage = (achieved / target) * 100;
                                if (percentage > 100) percentage = 100;
                                const color = (metrics?.variance || 0) >= 0 ? '#22c55e' : '#f59e0b';
                                return (
                                    <div style={{
                                        position: 'absolute', left: 0, top: 0, height: '100%',
                                        width: `${percentage}%`, background: color,
                                        borderRadius: 3, transition: 'width 1s ease-in-out'
                                    }} />
                                );
                            })()}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', fontWeight: 600, marginTop: 6 }}>
                            {metrics?.monthlyTarget ? Math.round(((metrics?.wonValue || 0) / metrics.monthlyTarget) * 100) : 0}% Achieved
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
                                            className="followup-item"
                                            onClick={() => setSelectedLeadId(fu.lead?.id)}
                                            style={{
                                                display: 'flex', alignItems: 'flex-start', gap: '14px',
                                                padding: '14px 20px', borderBottom: '1px solid var(--border)',
                                                cursor: 'pointer', transition: 'background 0.15s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-app)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {/* Icon Badge */}
                                            <div style={{
                                                width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
                                                background: isOverdue ? 'rgba(239,68,68,0.12)' : 'rgba(124,58,237,0.12)',
                                                color: isOverdue ? 'var(--danger)' : 'var(--accent-light)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Icon size={17} />
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {fu.lead?.name}
                                                    </div>
                                                    {fu.lead?.phone && (
                                                        <div style={{ fontSize: '12px', color: 'var(--accent-light)', fontWeight: 600 }}>
                                                            {fu.lead.phone}
                                                        </div>
                                                    )}
                                                    <div style={{
                                                        fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
                                                        color: isOverdue ? 'var(--danger)' : 'var(--text-muted)',
                                                        background: isOverdue ? 'rgba(239,68,68,0.1)' : 'var(--bg-app)',
                                                        padding: '3px 8px', borderRadius: 6,
                                                        display: 'flex', alignItems: 'center', gap: 4
                                                    }}>
                                                        {isOverdue && <AlertCircle size={10} />}
                                                        <Clock size={10} />
                                                        {new Date(fu.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                        {' '}{new Date(fu.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{
                                                        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                                        background: 'rgba(124,58,237,0.1)', color: 'var(--accent-light)',
                                                        padding: '2px 7px', borderRadius: 4, letterSpacing: '0.04em'
                                                    }}>{fu.type}</span>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {fu.notes || fu.lead?.company || '—'}
                                                    </span>
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

            {/* Lead details — inline modal, no navigation */}
            {selectedLeadId && (
                <LeadDetailsModal
                    leadId={selectedLeadId}
                    onClose={() => setSelectedLeadId(null)}
                    onSaved={fetchData}
                />
            )}

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
