import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Clock, CheckCircle } from 'lucide-react';
import { HRService } from '../hr/HRService';
import { getISTTodayString } from '../../lib/dateUtils';
import toast from 'react-hot-toast';

export function StatCard({ icon: Icon, label, value, color, to, state }) {
    return (
        <Link to={to} state={state} style={{ textDecoration: 'none' }}>
            <div className="stat-card">
                <div>
                    <div className="stat-value">{value ?? '—'}</div>
                    <div className="stat-label">{label}</div>
                </div>
                <div className="stat-icon" style={{ background: color }}>
                    <Icon size={22} color="#fff" />
                </div>
            </div>
        </Link>
    );
}

export function EmployeeCard({ employee, isAdminView, currentRange }) {
    const navigate = useNavigate();

    const goToTasks = (status = '') => {
        navigate('/tasks', {
            state: {
                assigned_to: employee.id,
                status,
                startDate: currentRange?.startDate,
                endDate: currentRange?.endDate
            }
        });
    };

    const isBDM = employee.sales_stats !== null;

    const goToPersonalTimesheet = () => {
        if (isAdminView) {
            if (isBDM) {
                navigate('/bdm-performance', {
                    state: {
                        agentId: employee.id,
                        startDate: currentRange?.startDate,
                        endDate: currentRange?.endDate
                    }
                });
            } else {
                navigate('/timesheet', {
                    state: {
                        viewUserId: employee.id,
                        startDate: currentRange?.startDate,
                        endDate: currentRange?.endDate
                    }
                });
            }
        }
    };
    const userRoles = employee.roles?.map(r => r.name?.toLowerCase()).filter(Boolean) || [];
    const hideTaskMetrics = userRoles.some(r => r.includes('admin') || r.includes('manager'));

    return (
        <div
            className="card"
            style={{
                padding: '16px',
                minWidth: '300px',
                flex: '1 1 350px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                cursor: isAdminView ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s',
                height: '100%' // Ensure uniform height
            }}
            onClick={goToPersonalTimesheet}
            onMouseOver={(e) => isAdminView && (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseOut={(e) => isAdminView && (e.currentTarget.style.transform = 'translateY(0)')}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {employee.avatar_url ? (
                    <img src={employee.avatar_url} alt={employee.full_name} className="emp-avatar-img" />
                ) : (
                    <div className="user-avatar" style={{ margin: 0 }}>{employee.full_name?.slice(0, 2).toUpperCase()}</div>
                )}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{employee.full_name}</div>
                        {isBDM && <span style={{ fontSize: 9, background: 'var(--accent-transparent)', color: 'var(--accent-light)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>BDM</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{employee.designation || 'Specialist'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-light)' }}>{employee.total_hours}h</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Logged</div>
                </div>
            </div>

            {isBDM ? (
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: 0 }}>
                    <div
                        style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border)' }}
                        onClick={(e) => { e.stopPropagation(); navigate('/leads', { state: { agent: employee.id } }); }}
                    >
                        <div style={{ fontSize: '14px', fontWeight: 800 }}>{employee.sales_stats.total_leads}</div>
                        <div style={{ fontSize: '8px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Leads</div>
                    </div>
                    <div
                        style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border)' }}
                        onClick={(e) => { e.stopPropagation(); navigate('/leads', { state: { agent: employee.id, status: 'Proposal' } }); }}
                    >
                        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-light)' }}>
                            ₹{Math.round(employee.sales_stats.pipeline_value / 1000)}k
                        </div>
                        <div style={{ fontSize: '8px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Pipeline</div>
                    </div>
                    <div
                        style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border)' }}
                        onClick={(e) => { e.stopPropagation(); navigate('/leads', { state: { agent: employee.id, status: 'Won' } }); }}
                    >
                        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--success)' }}>
                            ₹{Math.round(employee.sales_stats.won_value / 1000)}k
                        </div>
                        <div style={{ fontSize: '8px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Won Value</div>
                    </div>
                    <div
                        style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border)', gridColumn: 'span 1' }}
                        onClick={(e) => { e.stopPropagation(); navigate('/leads', { state: { agent: employee.id, status: 'Won' } }); }}
                    >
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b' }}>
                            {employee.sales_stats.conversion_rate.toFixed(1)}%
                        </div>
                        <div style={{ fontSize: '8px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Conv. Rate</div>
                    </div>
                    <div
                        style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border)', gridColumn: 'span 2' }}
                        onClick={(e) => { e.stopPropagation(); navigate('/leads', { state: { agent: employee.id } }); }}
                    >
                        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--info)' }}>
                            {employee.sales_stats.quotation_count}
                        </div>
                        <div style={{ fontSize: '8px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Quotations (Req)</div>
                    </div>
                </div>
            ) : !hideTaskMetrics && (
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: 0 }}>
                    <div
                        style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); goToTasks(); }}
                    >
                        <div style={{ fontSize: '14px', fontWeight: 700 }}>{employee.total_tasks}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tasks</div>
                    </div>
                    <div
                        style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); goToTasks('pending'); }}
                    >
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-light)' }}>{employee.pending_tasks}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Pending</div>
                    </div>
                    <div
                        style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); goToTasks('done'); }}
                    >
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)' }}>{employee.done_tasks}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Done</div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                    Recent Timesheet Items
                </div>
                {employee.timesheet_items?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {employee.timesheet_items.slice(0, 3).map(item => (
                            <div
                                key={item.id}
                                style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '6px', fontSize: '12px', cursor: item.project_id ? 'pointer' : 'default' }}
                                onClick={(e) => {
                                    if (item.project_id) {
                                        e.stopPropagation();
                                        navigate(`/projects/${item.project_id}`);
                                    }
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                    <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '8px' }}>
                                        {item.title}
                                    </span>
                                    <span style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{item.hours}</span>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{item.project || 'No Project'}</span>
                                    <span>{new Date(item.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                        {employee.timesheet_items.length > 3 && (
                            <Link to="/reports" style={{ fontSize: '11px', color: 'var(--accent-light)', textDecoration: 'none', textAlign: 'center', marginTop: '4px', display: 'block' }} onClick={(e) => e.stopPropagation()}>
                                + {employee.timesheet_items.length - 3} more items
                            </Link>
                        )}
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border)', padding: '12px', color: 'var(--text-dim)', fontSize: '11px', fontStyle: 'italic' }}>
                        No recent activity logged
                    </div>
                )}
            </div>
        </div>
    );
}

export function AttendanceWidget() {
    const { hasRole } = useAuth();
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);

    const isSuperAdmin = hasRole('super_admin') || hasRole('Super Admin');

    useEffect(() => {
        if (isSuperAdmin) {
            setLoading(false);
            return;
        }
        fetchAttendance();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [isSuperAdmin]);

    if (isSuperAdmin) return null;

    const fetchAttendance = async () => {
        try {
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();
            const res = await HRService.getMyAttendance(month, year);
            const records = res.data || [];
            const todayStr = getISTTodayString();
            setTodayAttendance(records.find(r => r.date === todayStr) || null);
        } catch (err) {
            console.error('Failed to fetch attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClockIn = async () => {
        try {
            const todayStr = getISTTodayString();
            await HRService.clockIn({ date: todayStr, time: new Date().toISOString() });
            toast.success('Clocked in!');
            fetchAttendance();
        } catch (err) {
            toast.error(err.message || 'Error clocking in');
        }
    };

    const handleClockOut = async () => {
        try {
            const todayStr = getISTTodayString();
            await HRService.clockOut({ date: todayStr, time: new Date().toISOString() });
            toast.success('Clocked out!');
            fetchAttendance();
        } catch (err) {
            toast.error(err.message || 'Error clocking out');
        }
    };

    let hoursWorkedToday = 0;
    if (todayAttendance?.check_in_time) {
        const start = new Date(todayAttendance.check_in_time);
        const end = todayAttendance.check_out_time ? new Date(todayAttendance.check_out_time) : currentTime;
        hoursWorkedToday = (end - start) / (1000 * 60 * 60);
    }

    if (loading) return <div className="stat-card" style={{ justifyContent: 'center' }}><div className="spinner" style={{ width: 20, height: 20 }} /></div>;

    const statusBadge = (status) => {
        const map = {
            Approved: 'badge badge-green',
            Rejected: 'badge badge-red',
            Pending: 'badge badge-yellow',
        };
        return <span className={map[status] || 'badge'} style={{ fontSize: 10, padding: '2px 6px' }}>{status}</span>;
    };

    return (
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
            <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span className="stat-label" style={{ fontSize: 13, fontWeight: 600 }}>Today's Attendance</span>
                <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={18} />
                </div>
            </div>

            <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
                    {currentTime.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>
                    {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>

                {!todayAttendance ? (
                    <button className="btn btn-primary" style={{ width: '100%', fontSize: 13, padding: '8px' }} onClick={handleClockIn}>
                        Clock In
                    </button>
                ) : !todayAttendance.check_out_time ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--info)', background: 'var(--info-bg)', padding: '6px 10px', borderRadius: 6, fontWeight: 500 }}>
                            Logged {hoursWorkedToday.toFixed(2)}h
                        </div>
                        <button className="btn btn-danger" style={{ width: '100%', fontSize: 13, padding: '8px' }} onClick={handleClockOut}>
                            Clock Out
                        </button>
                    </div>
                ) : (
                    <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                        <CheckCircle size={14} />
                        Done — {hoursWorkedToday.toFixed(2)}h
                    </div>
                )}
            </div>

            {todayAttendance && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-dim)', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                    <span>Status</span>
                    {statusBadge(todayAttendance.status)}
                </div>
            )}
        </div>
    );
}
