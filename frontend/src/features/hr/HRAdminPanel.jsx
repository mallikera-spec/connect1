import { useState, useEffect } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { HRService } from './HRService';
import { Clock, Calendar, FileText, Check, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSortable, SortableHeader } from '../../hooks/useSortable';
import DataTable from '../../components/common/DataTable';

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
                    ctc: e.ctc || e.base_salary || '',
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
                body: JSON.stringify({
                    joining_date: settings.joining_date || null,
                    date_of_joining: settings.joining_date || null,
                    ctc: parseFloat(settings.ctc) || 0,
                    base_salary: parseFloat(settings.ctc) || 0
                })
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

    const handleExportAttendanceCSV = () => {
        if (!sortedAttendance.length) return
        const headers = ['Employee', 'Date', 'Check In', 'Check Out', 'Duration (h)']
        const rows = sortedAttendance.map(rec => {
            let dur = 0
            if (rec.check_in_time && rec.check_out_time) dur = ((new Date(rec.check_out_time) - new Date(rec.check_in_time)) / 3600000).toFixed(2)
            return [`"${rec.user?.full_name || ''}"`, new Date(rec.date).toLocaleDateString(), rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString() : '', rec.check_out_time ? new Date(rec.check_out_time).toLocaleTimeString() : '', dur]
        })
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
        const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); link.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`; link.click()
    }

    const handleExportLeavesCSV = () => {
        if (!sortedLeaves.length) return
        const headers = ['Employee', 'Type', 'From', 'To', 'Days', 'Reason', 'Status']
        const rows = sortedLeaves.map(req => {
            const days = Math.ceil(Math.abs(new Date(req.end_date) - new Date(req.start_date)) / 86400000) + 1
            return [`"${req.user?.full_name || ''}"`, req.type || '', new Date(req.start_date).toLocaleDateString(), new Date(req.end_date).toLocaleDateString(), days, `"${req.reason || ''}"`, req.status || 'Pending']
        })
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
        const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); link.download = `leaves_${new Date().toISOString().split('T')[0]}.csv`; link.click()
    }

    const handleExportPayrollCSV = () => {
        if (!sortedSlips.length) return
        const headers = ['Employee', 'Month', 'Year', 'Base Salary', 'Deductions', 'Net Salary', 'Status']
        const rows = sortedSlips.map(slip => [`"${slip.user?.full_name || ''}"`, slip.month, slip.year, slip.base_salary, slip.deductions, slip.net_salary, slip.status])
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
        const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); link.download = `payroll_${payrollMonth}_${payrollYear}.csv`; link.click()
    }

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
                <div className="card polished-card" style={{ padding: 0 }}>
                    <DataTable
                        data={sortedAttendance}
                        fileName="pending-attendance"
                        loading={loading}
                        columns={[
                            {
                                label: 'Employee',
                                key: 'user.full_name',
                                render: (_, rec) => <strong>{rec.user?.full_name || '—'}</strong>
                            },
                            {
                                label: 'Date',
                                key: 'date',
                                render: (val) => <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(val).toLocaleDateString()}</span>
                            },
                            {
                                label: 'Check In',
                                key: 'check_in_time',
                                render: (val) => <span style={{ fontSize: 13 }}>{val ? new Date(val).toLocaleTimeString() : '—'}</span>
                            },
                            {
                                label: 'Check Out',
                                key: 'check_out_time',
                                render: (val) => <span style={{ fontSize: 13 }}>{val ? new Date(val).toLocaleTimeString() : '—'}</span>
                            },
                            {
                                label: 'Duration',
                                key: 'id',
                                render: (_, rec) => {
                                    let duration = 0;
                                    if (rec.check_in_time && rec.check_out_time) {
                                        duration = (new Date(rec.check_out_time) - new Date(rec.check_in_time)) / (1000 * 60 * 60);
                                    }
                                    return duration > 0 ? (
                                        <span style={{ color: duration < 9 ? 'var(--danger)' : 'var(--success)', fontWeight: 600, fontSize: 13 }}>
                                            {duration.toFixed(2)}h
                                        </span>
                                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>;
                                }
                            },
                            {
                                label: 'Action',
                                key: 'id',
                                render: (_, rec) => (
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
                                )
                            }
                        ]}
                    />
                </div>
            )}

            {/* Leaves Tab */}
            {activeTab === 'leaves' && (
                <div className="card polished-card" style={{ padding: 0 }}>
                    <DataTable
                        data={sortedLeaves}
                        fileName="pending-leaves"
                        loading={loading}
                        columns={[
                            {
                                label: 'Employee',
                                key: 'user.full_name',
                                render: (_, req) => <strong>{req.user?.full_name || '—'}</strong>
                            },
                            {
                                label: 'Type',
                                key: 'type',
                                render: (val, req) => (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <span className="badge badge-purple">{val}</span>
                                        {req.leave_type && <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>Policy: {req.leave_type.name}</span>}
                                    </div>
                                )
                            },
                            {
                                label: 'From',
                                key: 'start_date',
                                render: (val) => <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(val).toLocaleDateString()}</span>
                            },
                            {
                                label: 'To',
                                key: 'end_date',
                                render: (val) => <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(val).toLocaleDateString()}</span>
                            },
                            {
                                label: 'Days',
                                key: 'id',
                                render: (_, req) => Math.ceil(Math.abs(new Date(req.end_date) - new Date(req.start_date)) / (1000 * 60 * 60 * 24)) + 1
                            },
                            {
                                label: 'Reason',
                                key: 'reason',
                                render: (val) => <span style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 200 }} title={val}>{val}</span>
                            },
                            {
                                label: 'Action',
                                key: 'id',
                                render: (_, req) => (
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
                                )
                            }
                        ]}
                    />
                </div>
            )}

            {/* Payroll Tab */}
            {activeTab === 'payroll' && (
                <div className="card polished-card" style={{ padding: 0 }}>
                    <div className="table-toolbar" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: 15, fontWeight: 600 }}>Salary Slips</h2>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button className="btn btn-primary btn-sm"
                                onClick={handleGeneratePayroll}
                                disabled={generatingPayroll}
                                style={{ marginRight: 8 }}>
                                {generatingPayroll ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Generate Payroll'}
                            </button>
                            <select className="form-select" style={{ height: 36, fontSize: 13, width: 120, background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '0 8px' }}
                                value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)}>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>
                                        {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                            <select className="form-select" style={{ height: 36, fontSize: 13, width: 90, background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '0 8px' }}
                                value={payrollYear} onChange={e => setPayrollYear(e.target.value)}>
                                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DataTable
                        data={sortedSlips}
                        fileName={`payroll_${payrollMonth}_${payrollYear}`}
                        loading={loading}
                        columns={[
                            {
                                label: 'Employee',
                                key: 'user.full_name',
                                render: (_, slip) => <strong>{slip.user?.full_name || '—'}</strong>
                            },
                            {
                                label: 'Period',
                                key: 'id',
                                render: (_, slip) => <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{slip.month}/{slip.year}</span>
                            },
                            {
                                label: 'Base Salary',
                                key: 'base_salary',
                                render: (val) => <span style={{ fontSize: 13 }}>Rs {parseFloat(val).toLocaleString()}</span>
                            },
                            {
                                label: 'Deductions',
                                key: 'deductions',
                                render: (val) => <span style={{ color: 'var(--danger)', fontSize: 13 }}>-Rs {parseFloat(val).toLocaleString()}</span>
                            },
                            {
                                label: 'Net Salary',
                                key: 'net_salary',
                                render: (val) => <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: 13 }}>Rs {parseFloat(val).toLocaleString()}</span>
                            },
                            {
                                label: 'Status',
                                key: 'status',
                                render: (val) => statusBadge(val)
                            }
                        ]}
                    />
                </div>
            )}

            {/* Employee Settings Tab */}
            {activeTab === 'employees' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 600 }}>Employee HR &amp; Costing Settings</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sortedEmployees.length} employees</span>
                            <button className="btn btn-ghost btn-sm"
                                onClick={handleSyncAll}
                                disabled={syncing}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-light)', border: '1px solid var(--border)' }}
                            >
                                {syncing ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Clock size={14} />}
                                Sync All Balances
                            </button>
                        </div>
                    </div>

                    {sortedEmployees.length === 0 ? (
                        <div className="empty-state"><p>No employees found</p></div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                            {sortedEmployees.map(emp => (
                                <div key={emp.id} className="card polished-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {/* Card Header: Avatar + Info */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: '50%',
                                            background: 'linear-gradient(135deg, var(--accent), #4f46e5)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0
                                        }}>
                                            {(emp.full_name || 'U').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {emp.full_name}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                                {emp.designation && <span>{emp.designation}</span>}
                                                {emp.department && (
                                                    <span style={{ background: 'rgba(124,58,237,0.12)', color: 'var(--accent-light)', padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600 }}>
                                                        {emp.department}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: 11, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {emp.email}
                                    </div>

                                    {/* Editable Fields */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div>
                                            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joining Date</label>
                                            <input type="date" className="form-input"
                                                style={{ fontSize: 12, padding: '6px 10px', width: '100%' }}
                                                value={empSettings[emp.id]?.joining_date || ''}
                                                onChange={e => setEmpSettings(p => ({ ...p, [emp.id]: { ...p[emp.id], joining_date: e.target.value } }))}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Annual CTC (₹)</label>
                                            <input type="number" className="form-input"
                                                style={{ fontSize: 12, padding: '6px 10px', width: '100%' }}
                                                placeholder="e.g. 1200000"
                                                value={empSettings[emp.id]?.ctc || ''}
                                                onChange={e => setEmpSettings(p => ({ ...p, [emp.id]: { ...p[emp.id], ctc: e.target.value } }))}
                                            />
                                        </div>
                                    </div>

                                    <button className="btn btn-primary btn-sm"
                                        onClick={() => saveEmpSettings(emp.id)}
                                        disabled={savingEmp === emp.id}
                                        style={{ width: '100%', justifyContent: 'center' }}
                                    >
                                        {savingEmp === emp.id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Save Settings'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
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
