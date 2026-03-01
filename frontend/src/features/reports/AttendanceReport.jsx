import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { HRService } from '../hr/HRService';
import DateRangePicker from '../../components/DateRangePicker';
import { getISTMonthStartString, getISTTodayString } from '../../lib/dateUtils';
import { Search, Filter, FileSpreadsheet, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AttendanceReport() {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [filters, setFilters] = useState({
        startDate: getISTMonthStartString(),
        endDate: getISTTodayString(),
        userId: '',
        status: ''
    });

    const userRoles = user?.roles?.map(r => typeof r === 'string' ? r.toLowerCase() : r.name?.toLowerCase()) || [];
    const isAdminOrHR = userRoles.some(r => r.includes('admin') || r.includes('hr'));

    useEffect(() => {
        if (isAdminOrHR) {
            fetchEmployees();
        }
        fetchReport();
    }, [filters]);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/users');
            setEmployees(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch employees');
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = { ...filters };
            // If not admin, force own userId
            if (!isAdminOrHR) {
                params.userId = user.id;
            }
            const res = await HRService.getAttendanceReport(params);
            setRecords(res.data || []);
        } catch (err) {
            toast.error('Failed to load attendance report');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const statusBadge = (status) => {
        const map = {
            'Present': 'badge-green',
            'Absent': 'badge-red',
            'Half Day': 'badge-yellow',
            'Late': 'badge-orange'
        };
        return <span className={`badge ${map[status] || ''}`}>{status}</span>;
    };

    const formatTime = (isoString) => {
        if (!isoString) return '—';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const calculateWorkedHours = (start, end) => {
        if (!start || !end) return '—';
        const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
        return diff.toFixed(2) + 'h';
    };

    return (
        <div className="attendance-report">
            <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1>Attendance Report</h1>
                    <p style={{ color: 'var(--text-dim)' }}>Detailed logs of employee clock-in and clock-out activity.</p>
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
                            <option value="">{isAdminOrHR ? 'All Employees' : user.full_name}</option>
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
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Half Day">Half Day</option>
                            <option value="Late">Late</option>
                        </select>
                    </div>

                    <button className="btn btn-outline" onClick={() => setFilters({
                        startDate: getISTMonthStartString(),
                        endDate: getISTTodayString(),
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
                                <th>Date</th>
                                {isAdminOrHR && <th>Employee</th>}
                                <th>Clock In</th>
                                <th>Clock Out</th>
                                <th>Hours</th>
                                <th>Status</th>
                                <th>Approval</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={isAdminOrHR ? 7 : 6} style={{ textAlign: 'center', padding: 40 }}>
                                        <div className="spinner" style={{ margin: '0 auto' }} />
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdminOrHR ? 7 : 6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
                                        No attendance records found for this period.
                                    </td>
                                </tr>
                            ) : (
                                records.map(record => (
                                    <tr key={record.id}>
                                        <td style={{ fontWeight: 500 }}>{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                                        {isAdminOrHR && (
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 600 }}>{record.user?.full_name || 'Unknown'}</span>
                                                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{record.user?.email}</span>
                                                </div>
                                            </td>
                                        )}
                                        <td>{formatTime(record.check_in_time)}</td>
                                        <td>{formatTime(record.check_out_time)}</td>
                                        <td style={{ fontFamily: 'monospace' }}>{calculateWorkedHours(record.check_in_time, record.check_out_time)}</td>
                                        <td>{statusBadge(record.status)}</td>
                                        <td>
                                            {record.is_approved ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontSize: 12 }}>
                                                    <CheckCircle size={14} /> Approved
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning)', fontSize: 12 }}>
                                                    <Clock size={14} /> Pending
                                                </div>
                                            )}
                                        </td>
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
