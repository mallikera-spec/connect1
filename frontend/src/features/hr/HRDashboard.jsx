import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HRService } from './HRService';
import { Clock, Calendar, FileText, AlertCircle, X } from 'lucide-react';
import { AttendanceWidget } from '../dashboard/DashboardComponents';
import toast from 'react-hot-toast';

export default function HRDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    const [leaveBalance, setLeaveBalance] = useState({ totalAccrued: 0, used: 0, balance: 0, breakdown: [] });
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [myLeaves, setMyLeaves] = useState([]);
    const [mySlips, setMySlips] = useState([]);

    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [leaveForm, setLeaveForm] = useState({ start_date: '', end_date: '', type: 'Earned Leave', leave_type_id: '', reason: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();

            const [balanceRes, leavesRes, slipsRes, typesRes] = await Promise.all([
                HRService.getLeaveBalance().catch(() => ({ data: { totalAccrued: 0, used: 0, balance: 0, breakdown: [] } })),
                HRService.getMyLeaves().catch(() => ({ data: [] })),
                HRService.getMySalarySlips().catch(() => ({ data: [] })),
                HRService.getLeaveTypes().catch(() => ({ data: [] }))
            ]);

            setLeaveBalance(balanceRes.data || { totalAccrued: 0, used: 0, balance: 0, breakdown: [] });
            setMyLeaves(leavesRes.data || []);
            setMySlips(slipsRes.data || []);
            setLeaveTypes(typesRes.data || []);

            // Set default leave type if none selected
            if (typesRes.data?.length > 0) {
                setLeaveForm(p => ({ ...p, leave_type_id: typesRes.data[0].id, type: typesRes.data[0].name }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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
            setLeaveForm({
                start_date: '',
                end_date: '',
                type: leaveTypes[0]?.name || 'Earned Leave',
                leave_type_id: leaveTypes[0]?.id || '',
                reason: ''
            });
            fetchDashboardData();
        } catch (err) {
            toast.error(err.message || 'Error submitting leave');
        } finally {
            setSubmitting(false);
        }
    };

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

                <AttendanceWidget />

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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                            {(leaveBalance.breakdown || []).map(b => (
                                <div key={b.leave_type?.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--border)', textAlign: 'left' }}>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{b.leave_type?.name}</div>
                                    <div style={{ fontWeight: 700, fontSize: 13 }}>{Number(b.balance).toFixed(1)} <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-dim)' }}>rem.</span></div>
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
                                    <select className="form-select"
                                        value={leaveForm.leave_type_id}
                                        onChange={e => {
                                            const selected = leaveTypes.find(t => t.id === e.target.value);
                                            setLeaveForm(p => ({ ...p, leave_type_id: e.target.value, type: selected?.name || '' }));
                                        }}>
                                        {leaveTypes.map(t => (
                                            <option key={t.id} value={t.id}>
                                                {t.name} ({leaveBalance.breakdown?.find(b => b.leave_type.id === t.id)?.balance || 0} left)
                                            </option>
                                        ))}
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
