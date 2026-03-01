import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HRService } from './HRService';
import { Clock, Calendar, FileText, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSortable, SortableHeader } from '../../hooks/useSortable';

export default function HRAdminPanel() {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'attendance');

    const [pendingAttendance, setPendingAttendance] = useState([]);
    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [salarySlips, setSalarySlips] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [empSettings, setEmpSettings] = useState({}); // { [userId]: { joining_date, base_salary } }
    const [savingEmp, setSavingEmp] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [generatingPayroll, setGeneratingPayroll] = useState(false);

    // Filter state
    const [empSearch, setEmpSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Approval modal state
    const [approvalModal, setApprovalModal] = useState(null);
    // approvalModal = { type: 'attendance'|'leave', record, action: 'Approved'|'Rejected'|'Present'|... }
    const [adminComment, setAdminComment] = useState('');
    const [approving, setApproving] = useState(false);

    const now = new Date();
    const [payrollMonth, setPayrollMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth());
    const [payrollYear, setPayrollYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());

    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state?.tab]);

    useEffect(() => { fetchAllData(); }, [payrollMonth, payrollYear]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [attRes, leavesRes, empRes] = await Promise.all([
                HRService.getPendingAttendance().catch(() => ({ data: [] })),
                HRService.getPendingLeaves().catch(() => ({ data: [] })),
                fetch(`${import.meta.env.VITE_API_URL}/api/v1/users`, {
                    headers: { Authorization: `Bearer ${(await (await import('../../lib/supabase')).supabase.auth.getSession()).data.session?.access_token}` }
                }).then(r => r.json()).catch(() => ({ data: [] }))
            ]);
            setPendingAttendance(attRes.data || []);
            setPendingLeaves(leavesRes.data || []);

            const empList = empRes.data || [];
            setEmployees(empList);
            // Build initial settings map
            const settingsMap = {};
            empList.forEach(e => {
                settingsMap[e.id] = {
                    joining_date: e.date_of_joining || e.joining_date || '',
                    base_salary: e.base_salary || '',
                };
            });
            setEmpSettings(settingsMap);

            HRService.getAllSalarySlips(payrollMonth, payrollYear)
                .then(r => setSalarySlips(r.data || []))
                .catch(() => setSalarySlips([]));
        } catch (err) {
            // silent fallback
        } finally {
            setLoading(false);
        }
    };

    const openApprovalModal = (type, record, action) => {
        setAdminComment('');
        setApprovalModal({ type, record, action });
    };

    const closeApprovalModal = () => {
        setApprovalModal(null);
        setAdminComment('');
    };

    const saveEmpSettings = async (userId) => {
        setSavingEmp(userId);
        try {
            const settings = empSettings[userId];
            const session = (await (await import('../../lib/supabase')).supabase.auth.getSession()).data.session;
            await fetch(`${import.meta.env.VITE_API_URL}/api/v1/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
                body: JSON.stringify({ joining_date: settings.joining_date || null, base_salary: parseFloat(settings.base_salary) || 0 })
            });

            // Trigger sync for this user specifically or all
            await HRService.syncAllLeaveBalances();

            toast.success('Employee settings saved & balance synced');
        } catch (err) {
            toast.error('Error saving settings');
        } finally {
            setSavingEmp(null);
        }
    };

    const handleSyncAll = async () => {
        setSyncing(true);
        try {
            await HRService.syncAllLeaveBalances();
            toast.success('All leave balances synchronized');
            fetchAllData();
        } catch (err) {
            toast.error('Error syncing balances');
        } finally {
            setSyncing(false);
        }
    };

    const handleGeneratePayroll = async () => {
        setGeneratingPayroll(true);
        try {
            await HRService.generateSalarySlips({ month: payrollMonth, year: payrollYear });
            toast.success('Payroll generated/updated for all employees');
            // Refresh slips for the current month/year
            const r = await HRService.getAllSalarySlips(payrollMonth, payrollYear);
            setSalarySlips(r.data || []);
        } catch (err) {
            toast.error('Error generating payroll');
        } finally {
            setGeneratingPayroll(false);
        }
    };

    const handleConfirmApproval = async () => {
        if (!approvalModal) return;
        setApproving(true);
        try {
            if (approvalModal.type === 'attendance') {
                const isApproved = approvalModal.action !== 'Absent';
                await HRService.approveAttendance(approvalModal.record.id, approvalModal.action, isApproved, adminComment);
                toast.success(`Marked as ${approvalModal.action}`);
            } else {
                await HRService.updateLeaveStatus(approvalModal.record.id, approvalModal.action, adminComment);
                toast.success(`Leave ${approvalModal.action}`);
            }
            closeApprovalModal();
            fetchAllData();
        } catch (err) {
            toast.error('Error updating request');
        } finally {
            setApproving(false);
        }
    };

    const statusBadge = (status) => {
        const map = {
            Approved: 'badge badge-green',
            Rejected: 'badge badge-red',
            Pending: 'badge badge-yellow',
            Present: 'badge badge-green',
            Absent: 'badge badge-red',
            'Half Day': 'badge badge-yellow',
            Generated: 'badge badge-yellow',
            Paid: 'badge badge-green',
        };
        return <span className={map[status] || 'badge'}>{status}</span>;
    };

    // --- Filtering Logic ---
    const filterByEmployee = (item) => {
        if (!empSearch) return true;
        const name = (item.user?.full_name || item.full_name || '').toLowerCase();
        const email = (item.user?.email || item.email || '').toLowerCase();
        const search = empSearch.toLowerCase();
        return name.includes(search) || email.includes(search);
    };

    const filterByDate = (dateVal) => {
        if (!dateVal) return true;
        const d = new Date(dateVal);
        d.setHours(0, 0, 0, 0);
        if (dateFrom) {
            const from = new Date(dateFrom);
            from.setHours(0, 0, 0, 0);
            if (d < from) return false;
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(0, 0, 0, 0);
            if (d > to) return false;
        }
        return true;
    };

    const filteredAttendance = pendingAttendance.filter(r => filterByEmployee(r) && filterByDate(r.date));
    const filteredLeaves = pendingLeaves.filter(r => filterByEmployee(r) && (filterByDate(r.start_date) || filterByDate(r.end_date)));
    const filteredSlips = salarySlips.filter(r => filterByEmployee(r)); // Slips already filtered by Month/Year select
    const filteredEmployees = employees.filter(r => filterByEmployee(r) && filterByDate(r.joining_date || r.date_of_joining));

    const { sorted: sortedAttendance, sortKey: attSK, sortDir: attSD, toggleSort: attSort } = useSortable(filteredAttendance, 'date', 'desc');
    const { sorted: sortedLeaves, sortKey: lvSK, sortDir: lvSD, toggleSort: lvSort } = useSortable(filteredLeaves, 'start_date', 'asc');
    const { sorted: sortedEmployees, sortKey: empSK, sortDir: empSD, toggleSort: empSort } = useSortable(filteredEmployees, 'full_name', 'asc');
    const sortedSlips = filteredSlips; // Keep current order

    const tabs = [
        { key: 'attendance', label: 'Pending Attendance', icon: Clock, count: pendingAttendance.length },
        { key: 'leaves', label: 'Pending Leaves', icon: Calendar, count: pendingLeaves.length },
        { key: 'payroll', label: 'Payroll & Slips', icon: FileText },
        { key: 'employees', label: 'Employee Settings', icon: FileText },
    ];

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>HR Admin</h1>
                    <p>Approve attendance, manage leave requests, and view payroll</p>
                </div>
            </div>

            {/* Tab Bar */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
                {tabs.map(({ key, label, icon: Icon, count }) => (
                    <button key={key}
                        onClick={() => setActiveTab(key)}
                        style={{
                            padding: '10px 20px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === key ? '2px solid var(--accent)' : '2px solid transparent',
                            color: activeTab === key ? 'var(--accent-light)' : 'var(--text-muted)',
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            transition: 'color 0.15s',
                        }}
                    >
                        <Icon size={15} />
                        {label}
                        {count > 0 && (
                            <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Global Filters */}
            <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 240px' }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Search Employee</label>
                    <input
                        type="text"
                        placeholder="Name or email..."
                        className="form-input"
                        value={empSearch}
                        onChange={e => setEmpSearch(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>From Date</label>
                    <input
                        type="date"
                        className="form-input"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>To Date</label>
                    <input
                        type="date"
                        className="form-input"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                    />
                </div>
                {(empSearch || dateFrom || dateTo) && (
                    <button className="btn btn-ghost" onClick={() => { setEmpSearch(''); setDateFrom(''); setDateTo(''); }} style={{ height: '38px' }}>
                        Clear
                    </button>
                )}
            </div>

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
                <div className="table-wrapper">
                    <div className="table-toolbar">
                        <h2 style={{ fontSize: 15, fontWeight: 600 }}>Pending Attendance Records</h2>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <SortableHeader sortKey="user.full_name" label="Employee" currentSortKey={attSK} sortDir={attSD} onSort={attSort} />
                                <SortableHeader sortKey="date" label="Date" currentSortKey={attSK} sortDir={attSD} onSort={attSort} />
                                <SortableHeader sortKey="check_in_time" label="Check In" currentSortKey={attSK} sortDir={attSD} onSort={attSort} />
                                <SortableHeader sortKey="check_out_time" label="Check Out" currentSortKey={attSK} sortDir={attSD} onSort={attSort} />
                                <th>Duration</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAttendance.length > 0 ? sortedAttendance.map(rec => {
                                let duration = 0;
                                if (rec.check_in_time && rec.check_out_time) {
                                    duration = (new Date(rec.check_out_time) - new Date(rec.check_in_time)) / (1000 * 60 * 60);
                                }
                                return (
                                    <tr key={rec.id}>
                                        <td><strong>{rec.user?.full_name || '—'}</strong></td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(rec.date).toLocaleDateString()}</td>
                                        <td style={{ fontSize: 13 }}>{rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString() : '—'}</td>
                                        <td style={{ fontSize: 13 }}>{rec.check_out_time ? new Date(rec.check_out_time).toLocaleTimeString() : '—'}</td>
                                        <td>
                                            {duration > 0 ? (
                                                <span style={{ color: duration < 9 ? 'var(--danger)' : 'var(--success)', fontWeight: 600, fontSize: 13 }}>
                                                    {duration.toFixed(2)}h
                                                </span>
                                            ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                                                <button className="btn btn-primary btn-sm" onClick={() => openApprovalModal('attendance', rec, 'Present')}>
                                                    Present
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openApprovalModal('attendance', rec, 'Half Day')}>
                                                    Half Day
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => openApprovalModal('attendance', rec, 'Absent')}>
                                                    Absent
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="6"><div className="empty-state"><p>No pending attendance records</p></div></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Leaves Tab */}
            {activeTab === 'leaves' && (
                <div className="table-wrapper">
                    <div className="table-toolbar">
                        <h2 style={{ fontSize: 15, fontWeight: 600 }}>Pending Leave Requests</h2>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <SortableHeader sortKey="user.full_name" label="Employee" currentSortKey={lvSK} sortDir={lvSD} onSort={lvSort} />
                                <SortableHeader sortKey="type" label="Type" currentSortKey={lvSK} sortDir={lvSD} onSort={lvSort} />
                                <SortableHeader sortKey="start_date" label="From" currentSortKey={lvSK} sortDir={lvSD} onSort={lvSort} />
                                <SortableHeader sortKey="end_date" label="To" currentSortKey={lvSK} sortDir={lvSD} onSort={lvSort} />
                                <th>Reason</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedLeaves.length > 0 ? sortedLeaves.map(req => (
                                <tr key={req.id}>
                                    <td><strong>{req.user?.full_name || '—'}</strong></td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <span className="badge badge-purple">{req.type}</span>
                                            {req.leave_type && <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>Policy: {req.leave_type.name}</span>}
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(req.start_date).toLocaleDateString()}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(req.end_date).toLocaleDateString()}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 200 }} title={req.reason}>{req.reason}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                                            <button className="btn btn-ghost btn-sm btn-icon" title="Approve"
                                                style={{ color: 'var(--success)' }}
                                                onClick={() => openApprovalModal('leave', req, 'Approved')}>
                                                <Check size={15} />
                                            </button>
                                            <button className="btn btn-danger btn-sm btn-icon" title="Reject"
                                                onClick={() => openApprovalModal('leave', req, 'Rejected')}>
                                                <X size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6"><div className="empty-state"><p>No pending leave requests</p></div></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Payroll Tab */}
            {activeTab === 'payroll' && (
                <div className="table-wrapper">
                    <div className="table-toolbar">
                        <h2 style={{ fontSize: 15, fontWeight: 600 }}>Salary Slips</h2>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button className="btn btn-primary btn-sm"
                                onClick={handleGeneratePayroll}
                                disabled={generatingPayroll}
                                style={{ marginRight: 8 }}>
                                {generatingPayroll ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Generate Payroll'}
                            </button>
                            <select className="form-select" style={{ height: 36, fontSize: 13, width: 120 }}
                                value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)}>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>
                                        {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                            <select className="form-select" style={{ height: 36, fontSize: 13, width: 90 }}
                                value={payrollYear} onChange={e => setPayrollYear(e.target.value)}>
                                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Period</th>
                                <th>Base Salary</th>
                                <th>Deductions</th>
                                <th>Net Salary</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSlips.length > 0 ? sortedSlips.map(slip => (
                                <tr key={slip.id}>
                                    <td><strong>{slip.user?.full_name || '—'}</strong></td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{slip.month}/{slip.year}</td>
                                    <td style={{ fontSize: 13 }}>${parseFloat(slip.base_salary).toLocaleString()}</td>
                                    <td style={{ color: 'var(--danger)', fontSize: 13 }}>-${parseFloat(slip.deductions).toLocaleString()}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>${parseFloat(slip.net_salary).toLocaleString()}</td>
                                    <td>{statusBadge(slip.status)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6"><div className="empty-state"><p>No salary slips for this period</p></div></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Employee Settings Tab */}
            {activeTab === 'employees' && (
                <div className="table-wrapper">
                    <div className="table-toolbar">
                        <h2 style={{ fontSize: 15, fontWeight: 600 }}>Employee HR Settings</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Set joining date & base salary to calculate correct leave balance</span>
                            <button className="btn btn-ghost btn-sm"
                                onClick={handleSyncAll}
                                disabled={syncing}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-light)', border: '1px solid var(--accent-transparent)' }}
                            >
                                {syncing ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Clock size={14} />}
                                Sync All Balances
                            </button>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <SortableHeader sortKey="full_name" label="Employee" currentSortKey={empSK} sortDir={empSD} onSort={empSort} />
                                <SortableHeader sortKey="department" label="Department" currentSortKey={empSK} sortDir={empSD} onSort={empSort} />
                                <th>Joining Date</th>
                                <th>Base Salary (₹)</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedEmployees.length > 0 ? sortedEmployees.map(emp => (
                                <tr key={emp.id}>
                                    <td>
                                        <strong>{emp.full_name}</strong>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.email}</div>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{emp.department || '—'}</td>
                                    <td>
                                        <input type="date" className="form-input"
                                            style={{ fontSize: 13, padding: '6px 10px' }}
                                            value={empSettings[emp.id]?.joining_date || ''}
                                            onChange={e => setEmpSettings(p => ({ ...p, [emp.id]: { ...p[emp.id], joining_date: e.target.value } }))}
                                        />
                                    </td>
                                    <td>
                                        <input type="number" className="form-input"
                                            style={{ fontSize: 13, padding: '6px 10px' }}
                                            placeholder="e.g. 50000"
                                            value={empSettings[emp.id]?.base_salary || ''}
                                            onChange={e => setEmpSettings(p => ({ ...p, [emp.id]: { ...p[emp.id], base_salary: e.target.value } }))}
                                        />
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-primary btn-sm"
                                            onClick={() => saveEmpSettings(emp.id)}
                                            disabled={savingEmp === emp.id}>
                                            {savingEmp === emp.id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Save'}
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5"><div className="empty-state"><p>No employees found</p></div></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Approval Comment Modal */}
            {approvalModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeApprovalModal()}>
                    <div className="modal" style={{ maxWidth: 480 }}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {approvalModal.type === 'attendance' ? `Mark as ${approvalModal.action}` : `${approvalModal.action === 'Approved' ? 'Approve' : 'Reject'} Leave`}
                            </h2>
                            <button className="btn-icon" onClick={closeApprovalModal}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13 }}>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>{approvalModal.record.user?.full_name || 'Employee'}</div>
                                {approvalModal.type === 'attendance' ? (
                                    <div style={{ color: 'var(--text-muted)' }}>
                                        {new Date(approvalModal.record.date).toLocaleDateString()} &nbsp;·&nbsp;
                                        {approvalModal.record.check_in_time ? new Date(approvalModal.record.check_in_time).toLocaleTimeString() : '—'} → {approvalModal.record.check_out_time ? new Date(approvalModal.record.check_out_time).toLocaleTimeString() : '—'}
                                    </div>
                                ) : (
                                    <div style={{ color: 'var(--text-muted)' }}>
                                        {approvalModal.record.type} &nbsp;·&nbsp;
                                        {new Date(approvalModal.record.start_date).toLocaleDateString()} → {new Date(approvalModal.record.end_date).toLocaleDateString()}
                                        {approvalModal.record.reason && <div style={{ marginTop: 4 }}>Reason: {approvalModal.record.reason}</div>}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Admin Comment <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    placeholder="Add a note for the employee…"
                                    value={adminComment}
                                    onChange={e => setAdminComment(e.target.value)}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={closeApprovalModal}>Cancel</button>
                            <button
                                className={approvalModal.action === 'Rejected' || approvalModal.action === 'Absent' ? 'btn btn-danger' : 'btn btn-primary'}
                                onClick={handleConfirmApproval}
                                disabled={approving}
                            >
                                {approving
                                    ? <span className="spinner" style={{ width: 16, height: 16 }} />
                                    : (approvalModal.type === 'attendance' ? `Mark ${approvalModal.action}` : approvalModal.action)
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
