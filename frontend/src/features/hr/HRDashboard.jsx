import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HRService } from './HRService';
import { Clock, Calendar, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HRDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    const [todayAttendance, setTodayAttendance] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [leaveBalance, setLeaveBalance] = useState({ totalAccrued: 0, used: 0, balance: 0 });
    const [myLeaves, setMyLeaves] = useState([]);
    const [mySlips, setMySlips] = useState([]);

    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [leaveForm, setLeaveForm] = useState({ start_date: '', end_date: '', type: 'Paid Leave', reason: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchDashboardData();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();

            const [attendanceRes, balanceRes, leavesRes, slipsRes] = await Promise.all([
                HRService.getMyAttendance(month, year).catch(() => ({ data: [] })),
                HRService.getLeaveBalance().catch(() => ({ data: { totalAccrued: 0, used: 0, balance: 0 } })),
                HRService.getMyLeaves().catch(() => ({ data: [] })),
                HRService.getMySalarySlips().catch(() => ({ data: [] })),
            ]);

            const records = attendanceRes.data || [];
            const todayStr = new Date().toISOString().split('T')[0];
            setTodayAttendance(records.find(r => r.date === todayStr) || null);

            setLeaveBalance(balanceRes.data || { totalAccrued: 0, used: 0, balance: 0 });
            setMyLeaves(leavesRes.data || []);
            setMySlips(slipsRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    const handleClockIn = async () => {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            await HRService.clockIn({ date: todayStr, time: new Date().toISOString() });
            toast.success('Clocked in!');
            fetchDashboardData();
        } catch (err) {
            toast.error(err.message || 'Error clocking in');
        }
    };

    const handleClockOut = async () => {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            await HRService.clockOut({ date: todayStr, time: new Date().toISOString() });
            toast.success('Clocked out!');
            fetchDashboardData();
        } catch (err) {
            toast.error(err.message || 'Error clocking out');
        }
    };

    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        if (new Date(leaveForm.end_date) < new Date(leaveForm.start_date)) {
            return toast.error('End date must be after start date');
        }
        setSubmitting(true);
        try {
            await HRService.submitLeaveRequest(leaveForm);
            toast.success('Leave request submitted');
            setIsLeaveModalOpen(false);
            setLeaveForm({ start_date: '', end_date: '', type: 'Paid Leave', reason: '' });
            fetchDashboardData();
        } catch (err) {
            toast.error(err.message || 'Error submitting leave');
        } finally {
            setSubmitting(false);
        }
    };

    let hoursWorkedToday = 0;
    if (todayAttendance?.check_in_time) {
        const start = new Date(todayAttendance.check_in_time);
        const end = todayAttendance.check_out_time ? new Date(todayAttendance.check_out_time) : currentTime;
        hoursWorkedToday = (end - start) / (1000 * 60 * 60);
    }

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;

    const statusBadge = (status) => {
        const map = {
            Approved: 'badge badge-green',
            Rejected: 'badge badge-red',
            Pending: 'badge badge-yellow',
        };
        return <span className={map[status] || 'badge'}>{status}</span>;
    };

    const latestSlip = mySlips[0] || null;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>My HR</h1>
                    <p>Manage attendance, leaves, and view your payslips</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>

                {/* Clock Card */}
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="stat-header">
                        <span className="stat-label">Today's Attendance</span>
                        <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)', flexShrink: 0 }}>
                            <Clock size={18} />
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 700 }}>
                            {currentTime.toLocaleTimeString()}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                            {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>

                        {!todayAttendance ? (
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleClockIn}>
                                Clock In
                            </button>
                        ) : !todayAttendance.check_out_time ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ fontSize: 12, color: 'var(--info)', background: 'var(--info-bg)', padding: '6px 10px', borderRadius: 6 }}>
                                    In since {new Date(todayAttendance.check_in_time).toLocaleTimeString()} — {hoursWorkedToday.toFixed(2)}h worked
                                </div>
                                <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleClockOut}>
                                    Clock Out
                                </button>
                            </div>
                        ) : (
                            <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '10px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13 }}>
                                <CheckCircle size={15} />
                                Shift done — {hoursWorkedToday.toFixed(2)}h
                            </div>
                        )}
                    </div>
                    {todayAttendance && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                            <span>Approval Status</span>
                            {statusBadge(todayAttendance.status)}
                        </div>
                    )}
                </div>

                {/* Leave Balance Card */}
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="stat-header">
                        <span className="stat-label">Leave Balance</span>
                        <div className="stat-icon" style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--accent-light)', flexShrink: 0 }}>
                            <Calendar size={18} />
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 44, fontWeight: 700, color: 'var(--accent-light)', lineHeight: 1 }}>
                            {Number(leaveBalance.balance).toFixed(1)}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>days available</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {[['Accrued', Number(leaveBalance.totalAccrued).toFixed(1)], ['Used', leaveBalance.used]].map(([label, val]) => (
                                <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
                                    <div style={{ fontWeight: 600 }}>{val}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => setIsLeaveModalOpen(true)}>
                        Apply for Leave
                    </button>
                </div>

                {/* Latest Payslip Card */}
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="stat-header">
                        <span className="stat-label">Latest Payslip</span>
                        <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)', flexShrink: 0 }}>
                            <FileText size={18} />
                        </div>
                    </div>
                    {latestSlip ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {new Date(latestSlip.year, latestSlip.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </div>
                            <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--success)', marginBottom: 4 }}>
                                ${parseFloat(latestSlip.net_salary).toLocaleString()}
                            </div>
                            {[['Base Salary', `$${parseFloat(latestSlip.base_salary).toLocaleString()}`, false],
                              ['Deductions', `-$${parseFloat(latestSlip.deductions).toLocaleString()}`, true]].map(([label, val, isDanger]) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                                    <span style={{ color: isDanger ? 'var(--danger)' : 'inherit' }}>{val}</span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                                {statusBadge(latestSlip.status)}
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                            No payslips generated yet
                        </div>
                    )}
                </div>
            </div>

            {/* Leave History */}
            <div className="table-wrapper">
                <div className="table-toolbar">
                    <h2 style={{ fontSize: 15, fontWeight: 600 }}>My Leave History</h2>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Reason</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myLeaves.length > 0 ? myLeaves.map(leave => (
                            <tr key={leave.id}>
                                <td><strong>{leave.type}</strong></td>
                                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(leave.start_date).toLocaleDateString()}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(leave.end_date).toLocaleDateString()}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{leave.reason}</td>
                                <td>{statusBadge(leave.status)}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5"><div className="empty-state"><p>No leave requests yet</p></div></td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Leave Modal */}
            {isLeaveModalOpen && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsLeaveModalOpen(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">Apply for Leave</h2>
                            <button className="btn-icon" onClick={() => setIsLeaveModalOpen(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleLeaveSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Start Date</label>
                                        <input type="date" className="form-input" required
                                            value={leaveForm.start_date}
                                            onChange={e => setLeaveForm(p => ({ ...p, start_date: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">End Date</label>
                                        <input type="date" className="form-input" required
                                            value={leaveForm.end_date}
                                            onChange={e => setLeaveForm(p => ({ ...p, end_date: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Leave Type</label>
                                    <select className="form-select" value={leaveForm.type}
                                        onChange={e => setLeaveForm(p => ({ ...p, type: e.target.value }))}>
                                        <option value="Paid Leave">Paid Leave ({Number(leaveBalance.balance).toFixed(1)} days available)</option>
                                        <option value="Unpaid Leave">Unpaid Leave</option>
                                        <option value="Sick Leave">Sick Leave</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reason</label>
                                    <textarea className="form-input" rows="3" required
                                        placeholder="Brief reason for the leave…"
                                        value={leaveForm.reason}
                                        onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                                {leaveForm.type === 'Paid Leave' && leaveBalance.balance <= 0 && (
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 12px', borderRadius: 8, fontSize: 13 }}>
                                        <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
                                        <span>No paid leaves remaining. This will be treated as unpaid.</span>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setIsLeaveModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
