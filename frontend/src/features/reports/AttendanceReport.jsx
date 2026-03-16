import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { HRService } from '../hr/HRService';
import DateRangePicker from '../../components/DateRangePicker';
import { getISTMonthStartString, getISTTodayString } from '../../lib/dateUtils';
import { Search, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../../components/common/DataTable';
import { formatDate } from '../../utils/formatters';

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
    const isAdminOrHR = userRoles.some(r => r.includes('admin') || r.includes('hr') || r.includes('director') || r.includes('investor'));

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

    const formatTime = (isoString) => {
        if (!isoString) return '—';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const calculateWorkedHours = (start, end) => {
        if (!start || !end) return '—';
        const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
        return diff.toFixed(2) + 'h';
    };

    const columns = useMemo(() => [
        { 
            label: 'Date', 
            key: 'date', 
            type: 'date', 
            width: '150px',
            render: (val) => formatDate(val)
        },
        ...(isAdminOrHR ? [{ 
            label: 'Employee', 
            key: 'user.full_name', 
            width: '200px',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{record.user?.full_name || 'Unknown'}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{record.user?.email}</span>
                </div>
            )
        }] : []),
        { 
            label: 'Clock In', 
            key: 'check_in_time', 
            width: '120px',
            render: (val) => formatTime(val)
        },
        { 
            label: 'Clock Out', 
            key: 'check_out_time', 
            width: '120px',
            render: (val) => formatTime(val)
        },
        { 
            label: 'Hours', 
            key: 'hours', 
            type: 'number', 
            width: '100px',
            render: (_, record) => calculateWorkedHours(record.check_in_time, record.check_out_time)
        },
        { 
            label: 'Status', 
            key: 'status', 
            type: 'status', 
            width: '120px',
            render: (status) => {
                const map = {
                    'Present': 'badge-green',
                    'Absent': 'badge-red',
                    'Half Day': 'badge-yellow',
                    'Late': 'badge-orange',
                    'Late Clock In': 'badge-orange',
                    'Early Clock Out': 'badge-orange'
                };
                return <span className={`badge ${map[status] || ''}`}>{status}</span>;
            }
        },
        { 
            label: 'Approval', 
            key: 'is_approved', 
            type: 'status', 
            width: '150px',
            render: (_, record) => {
                if (record.status === 'Pending') {
                    return <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning)', fontSize: 12, justifyContent: 'center' }}>
                        <Clock size={14} /> Pending
                    </div>;
                }
                return record.is_approved ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontSize: 12, justifyContent: 'center' }}>
                        <CheckCircle size={14} /> Approved
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--danger)', fontSize: 12, justifyContent: 'center' }}>
                        <XCircle size={14} /> Rejected
                    </div>
                );
            }
        }
    ], [isAdminOrHR]);

    return (
        <div className="attendance-report">
            <div className="page-header">
                <div>
                    <h1>Attendance Report</h1>
                    <p>Detailed logs of employee clock-in and clock-out activity.</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <DateRangePicker
                        startDate={filters.startDate}
                        endDate={filters.endDate}
                        onRangeChange={(range) => setFilters(prev => ({ ...prev, ...range }))}
                    />
                </div>
            </div>

            <div className="card polished-card filter-bar" style={{ marginBottom: 20, padding: 16 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                        <select
                            className="form-select"
                            style={{ paddingLeft: 36, width: '100%' }}
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
                            className="form-select"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Half Day">Half Day</option>
                            <option value="Late">Late</option>
                            <option value="Late Clock In">Late Clock In</option>
                            <option value="Early Clock Out">Early Clock Out</option>
                        </select>
                    </div>

                    <button className="btn btn-ghost" onClick={() => setFilters({
                        startDate: getISTMonthStartString(),
                        endDate: getISTTodayString(),
                        userId: '',
                        status: ''
                    })}>
                        Clear Filters
                    </button>
                    <button className="btn btn-secondary" onClick={fetchReport}>Apply Filters</button>
                </div>
            </div>

            <div className="card table-card">
                <DataTable
                    data={records}
                    columns={columns}
                    fileName="attendance_report"
                    loading={loading}
                />
            </div>

            <style>{`
                .attendance-report { padding: 8px; }
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
                .badge-green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .badge-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .badge-yellow { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .badge-orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }
                .filter-bar { background: var(--bg-card); border: 1px solid var(--border); }
            `}</style>
        </div>
    );
}
