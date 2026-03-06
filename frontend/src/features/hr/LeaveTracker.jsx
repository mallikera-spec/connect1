import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { HRService } from './HRService';
import DateRangePicker from '../../components/DateRangePicker';
import { getISTMonthStartString, getISTTodayString, getISTMonthEndString } from '../../lib/dateUtils';
import { Search, Calendar, FileSpreadsheet, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LeaveTracker() {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [leaveBalance, setLeaveBalance] = useState({ totalAccrued: 0, used: 0, balance: 0, breakdown: [] });

    const [filters, setFilters] = useState({
        startDate: getISTMonthStartString(),
        endDate: getISTMonthEndString(),
        userId: '',
        status: ''
    });

    const userRoles = (user?.roles || []).map(r =>
        (typeof r === 'string' ? r : (r.name || '')).toLowerCase()
    );
    const isAdminOrHR = userRoles.some(r =>
        r.includes('admin') ||
        r.includes('hr') ||
        r.includes('manager')
    );
    const canViewAll = isAdminOrHR || user?.roles?.includes('super_admin');

    useEffect(() => {
        if (isAdminOrHR) {
            fetchEmployees();
        }
        fetchReport();
        fetchBalance();
    }, [filters]);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/users');
            setEmployees(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch employees');
        }
    };

    const fetchBalance = async () => {
        try {
            const userId = filters.userId || user.id;
            const res = await HRService.getLeaveBalance(userId);
            setLeaveBalance(res.data || { totalAccrued: 0, used: 0, balance: 0, breakdown: [] });
        } catch (err) {
            console.error('Failed to fetch leave balance');
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = { ...filters };
            // If not admin, force own userId
            if (!isAdminOrHR) {
                params.userId = user?.id;
            }
            const res = await HRService.getLeaveReport(params);
            setRecords(res.data || []);
        } catch (err) {
            toast.error('Failed to load leave report');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const statusBadge = (status) => {
        const map = {
            'Approved': 'badge-green',
            'Rejected': 'badge-red',
            'Pending': 'badge-yellow',
        };
        return <span className={`badge ${map[status] || ''}`}>{status}</span>;
    };

    return (
        <div className="leave-tracker">
            <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1>Leave Tracker</h1>
                    <p style={{ color: 'var(--text-dim)' }}>Track leave requests and balances across the organization.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <DateRangePicker
                        startDate={filters.startDate}
                        endDate={filters.endDate}
                        onRangeChange={(range) => setFilters(prev => ({ ...prev, ...range }))}
                    />
                    <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileSpreadsheet size={18} /> Export
                    </button>
                </div>
            </div>

            {/* Leave Balance Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="stat-header">
                        <span className="stat-label">Available Balance</span>
                        <div className="stat-icon" style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--accent-light)' }}>
                            <Calendar size={18} />
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent-light)' }}>
                            {Number(leaveBalance.balance).toFixed(1)} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-dim)' }}>days</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                            Out of {Number(leaveBalance.totalAccrued).toFixed(1)} accrued
                        </div>
                    </div>
                </div>

                {leaveBalance.breakdown?.map(b => (
                    <div key={b.leave_type?.id} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div className="stat-header">
                            <span className="stat-label" style={{ fontSize: 13 }}>{b.leave_type?.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <div style={{ fontSize: 24, fontWeight: 700 }}>
                                    {Number(b.balance).toFixed(1)}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Remaining</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dim)' }}>
                                    {Number(b.used).toFixed(1)}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Used</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card polished-card" style={{ marginBottom: 20, padding: 16 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                        <select
                            className="input"
                            style={{ paddingLeft: 36 }}
                            value={filters.userId}
                            onChange={(e) => handleFilterChange('userId', e.target.value)}
                            disabled={!isAdminOrHR}
                        >
                            <option value="">{isAdminOrHR ? 'All Employees' : (user?.full_name || 'My Leaves')}</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ minWidth: 150 }}>
                        <select
                            className="input"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>

                    <button className="btn btn-outline" onClick={() => setFilters({
                        startDate: getISTMonthStartString(),
                        endDate: getISTMonthEndString(),
                        userId: '',
                        status: ''
                    })}>
                        Clear Filters
                    </button>
                </div>
            </div>

            <div className="card polished-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>From Date</th>
                                <th>To Date</th>
                                {isAdminOrHR && <th>Employee</th>}
                                <th>Type</th>
                                <th>Reason</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={isAdminOrHR ? 6 : 5} style={{ textAlign: 'center', padding: 40 }}>
                                        <div className="spinner" style={{ margin: '0 auto' }} />
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdminOrHR ? 6 : 5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
                                        No leave records found for this period.
                                    </td>
                                </tr>
                            ) : (
                                records.map(record => (
                                    <tr key={record.id}>
                                        <td style={{ fontWeight: 500 }}>{new Date(record.start_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td style={{ fontWeight: 500 }}>{new Date(record.end_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        {isAdminOrHR && (
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 600 }}>{record.user?.full_name || 'Unknown'}</span>
                                                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{record.user?.email}</span>
                                                </div>
                                            </td>
                                        )}
                                        <td>
                                            <span className="badge badge-purple">{record.type}</span>
                                        </td>
                                        <td style={{ fontSize: 13, color: 'var(--text-dim)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={record.reason}>
                                            {record.reason}
                                        </td>
                                        <td>{statusBadge(record.status)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
