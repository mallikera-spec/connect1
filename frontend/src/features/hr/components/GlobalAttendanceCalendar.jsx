import { useState, useEffect } from 'react';
import { HRService } from '../HRService';
import { ChevronLeft, ChevronRight, Download, Filter, Search, Calendar as CalendarIcon, X, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GlobalAttendanceCalendar() {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('All Roles');
    const [selectedDayDetail, setSelectedDayDetail] = useState(null);

    useEffect(() => {
        fetchCalendarData();
    }, [month, year]);

    const fetchCalendarData = async () => {
        setLoading(true);
        try {
            const res = await HRService.getGlobalAttendanceCalendar(month, year);
            setData(res.data || []);
        } catch (err) {
            toast.error('Failed to load attendance calendar');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
    };

    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const getStatusStyles = (dayData) => {
        if (!dayData) return { bg: 'transparent', color: 'transparent', text: '' };

        if (dayData.status === 'Approved Leave') {
            return {
                bg: dayData.is_half_day ? '#f59e0b' : '#10b981',
                color: '#fff',
                text: dayData.is_half_day ? 'HL' : 'L'
            };
        }
        if (dayData.status === 'Present') {
            return { bg: '#3b82f6', color: '#fff', text: 'P' };
        }
        if (dayData.status === 'Absent') {
            return { bg: '#ef4444', color: '#fff', text: 'A' };
        }
        if (dayData.status === 'Half Day') {
            return { bg: '#f59e0b', color: '#fff', text: 'H' };
        }
        if (dayData.status === 'Holiday') {
            return { bg: '#8b5cf6', color: '#fff', text: 'H' };
        }
        if (dayData.status === 'Week Off') {
            return { bg: 'rgba(255,255,255,0.08)', color: 'var(--text-dim)', text: 'W' };
        }
        if (dayData.status === 'WFH') {
            return { bg: '#14b8a6', color: '#fff', text: 'WFH' };
        }
        return { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)', text: '?' };
    };

    const roles = ['All Roles', ...new Set(data.map(item => item.user.role).filter(Boolean))];

    const filteredData = data.filter(item => {
        const matchesSearch = item.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole === 'All Roles' || item.user.role === selectedRole;
        return matchesSearch && matchesRole;
    });

    const handleCellClick = (day, dayData, user) => {
        if (!dayData) return;
        setSelectedDayDetail({ day, dayData, user, date: new Date(year, month - 1, day) });
    };

    return (
        <div className="attendance-calendar-container animate-in">
            <div className="card polished-card" style={{ padding: 20, background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="btn-group" style={{ background: 'var(--card-bg-light)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
                            <button className="btn-icon" onClick={handlePrevMonth}><ChevronLeft size={18} /></button>
                            <span style={{ padding: '0 16px', fontWeight: 600, minWidth: 140, textAlign: 'center' }}>
                                {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </span>
                            <button className="btn-icon" onClick={handleNextMonth}><ChevronRight size={18} /></button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, flex: 1, justifyContent: 'flex-end', minWidth: 280 }}>
                        <div style={{ position: 'relative', maxWidth: 200, width: '100%' }}>
                            <Filter size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <select
                                className="input"
                                style={{ paddingLeft: 36, background: 'var(--input-bg)', border: '1px solid var(--border)' }}
                                value={selectedRole}
                                onChange={e => setSelectedRole(e.target.value)}
                            >
                                {roles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ position: 'relative', maxWidth: 300, width: '100%' }}>
                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input
                                type="text"
                                className="input"
                                placeholder="Search employee..."
                                style={{ paddingLeft: 36, background: 'var(--input-bg)', border: '1px solid var(--border)' }}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="calendar-legend" style={{ display: 'flex', gap: 20, marginBottom: 20, fontSize: 12, color: 'var(--text-dim)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#3b82f6' }}></div>
                        <span>P: Present</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981' }}></div>
                        <span>L: Approved Leave</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#f59e0b' }}></div>
                        <span>H / HL: Half Day</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#8b5cf6' }}></div>
                        <span>H: Holiday</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.08)' }}></div>
                        <span>W: Week Off</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#14b8a6' }}></div>
                        <span>WFH: Work From Home</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#ef4444' }}></div>
                        <span>A: Absent</span>
                    </div>
                </div>

                <div className="table-responsive" style={{
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    overflow: 'auto',
                    maxHeight: '700px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    background: 'var(--card-bg)' // Solid background container
                }}>
                    <table className="calendar-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 30, background: 'var(--card-bg-light)', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    borderBottom: '2px solid var(--border)',
                                    borderRight: '2px solid var(--border)',
                                    minWidth: 220,
                                    position: 'sticky',
                                    left: 0,
                                    top: 0,
                                    background: 'var(--card-bg-light)',
                                    zIndex: 31,
                                    fontSize: 12,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    color: 'var(--text-dim)'
                                }}>Employee Name</th>
                                {days.map(d => {
                                    const date = new Date(year, month - 1, d);
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                    return (
                                        <th key={d} style={{
                                            padding: '8px 4px',
                                            textAlign: 'center',
                                            borderBottom: '2px solid var(--border)',
                                            fontSize: 10,
                                            minWidth: 42,
                                            background: isWeekend ? 'rgba(255,255,255,0.02)' : 'transparent',
                                            color: isWeekend ? 'var(--text-muted)' : 'var(--text)'
                                        }}>
                                            <div style={{ fontWeight: 800 }}>{d}</div>
                                            <div style={{ fontSize: 9, opacity: 0.6, textTransform: 'uppercase' }}>
                                                {date.toLocaleDateString('default', { weekday: 'short' })}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i}>
                                        <td style={{ padding: '16px', borderBottom: '1px solid var(--border)', borderRight: '2px solid var(--border)', position: 'sticky', left: 0, background: 'var(--card-bg)' }}>
                                            <div className="skeleton" style={{ height: 20, width: '80%' }}></div>
                                        </td>
                                        {days.map(d => (
                                            <td key={d} style={{ padding: '4px', borderBottom: '1px solid var(--border)', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
                                                <div className="skeleton" style={{ height: 28, width: 28, margin: '0 auto', borderRadius: 4 }}></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={daysInMonth + 1} style={{ padding: '64px', textAlign: 'center', color: 'var(--text-dim)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                            <Search size={40} style={{ opacity: 0.2 }} />
                                            <span>No matching employees found for this search.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.user.id} className="calendar-row">
                                        <td style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid var(--border)',
                                            borderRight: '2px solid var(--border)',
                                            position: 'sticky',
                                            left: 0,
                                            background: 'var(--card-bg-light)',
                                            zIndex: 5,
                                            transition: 'background 0.2s'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{item.user.full_name}</span>
                                                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{item.user.email}</span>
                                            </div>
                                        </td>
                                        {days.map(d => {
                                            const dayData = item.days[d];
                                            const styles = getStatusStyles(dayData);
                                            const date = new Date(year, month - 1, d);
                                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                                            return (
                                                <td key={d}
                                                    onClick={() => handleCellClick(d, dayData, item.user)}
                                                    style={{
                                                        padding: '1px',
                                                        borderBottom: '1px solid var(--border)',
                                                        borderRight: '1px solid var(--border)',
                                                        textAlign: 'center',
                                                        background: isWeekend ? 'rgba(255,255,255,0.02)' : 'transparent',
                                                        cursor: dayData ? 'pointer' : 'default',
                                                        height: 48
                                                    }}>
                                                    {dayData && (
                                                        <div
                                                            className="calendar-cell"
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: 11,
                                                                fontWeight: 800,
                                                                background: styles.bg,
                                                                color: styles.color,
                                                                transition: 'transform 0.1s, filter 0.2s',
                                                                position: 'relative',
                                                                zIndex: 1
                                                            }}
                                                        >
                                                            {styles.text}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedDayDetail && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedDayDetail(null)}>
                    <div className="modal" style={{ maxWidth: 450, borderRadius: 20, overflow: 'hidden' }}>
                        <div className="modal-header" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, var(--accent), #4338ca)', color: 'white', border: 'none' }}>
                            <div>
                                <h2 className="modal-title" style={{ color: 'white' }}>Day Details</h2>
                                <p style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                                    {selectedDayDetail.date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <button className="btn-icon" onClick={() => setSelectedDayDetail(null)} style={{ color: 'white', background: 'rgba(255,255,255,0.1)' }}><X size={18} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                                <div style={{
                                    width: 54, height: 54, borderRadius: '50%',
                                    background: 'var(--card-bg-light)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20, fontWeight: 700, color: 'var(--accent)',
                                    border: '2px solid var(--border)'
                                }}>
                                    {selectedDayDetail.user.full_name[0].toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedDayDetail.user.full_name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{selectedDayDetail.user.email}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="detail-item" style={{ background: 'var(--card-bg-light)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
                                        <span className="badge" style={{
                                            background: getStatusStyles(selectedDayDetail.dayData).bg,
                                            color: '#fff',
                                            fontWeight: 700,
                                            padding: '4px 12px',
                                            borderRadius: 8
                                        }}>
                                            {selectedDayDetail.dayData.status}
                                        </span>
                                    </div>
                                </div>

                                {selectedDayDetail.dayData.type === 'Leave' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div style={{ background: 'var(--card-bg-light)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>Leave Type</div>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedDayDetail.dayData.leave_type || 'Custom Leave'}</div>
                                        </div>
                                        <div style={{ background: 'var(--card-bg-light)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>Duration</div>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedDayDetail.dayData.is_half_day ? `Half Day (${selectedDayDetail.dayData.session})` : 'Full Day'}</div>
                                        </div>
                                    </div>
                                )}

                                {selectedDayDetail.dayData.type === 'Attendance' && (
                                    <div style={{ background: 'var(--card-bg-light)', borderRadius: 12, padding: 16, border: '1px solid var(--border)', display: 'flex', gap: 20 }}>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            <Clock size={16} style={{ color: 'var(--success)' }} />
                                            <div>
                                                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Check In</div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>
                                                    {selectedDayDetail.dayData.check_in_time ? new Date(selectedDayDetail.dayData.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            <Clock size={16} style={{ color: 'var(--danger)' }} />
                                            <div>
                                                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Check Out</div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>
                                                    {selectedDayDetail.dayData.check_out_time ? new Date(selectedDayDetail.dayData.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedDayDetail.dayData.type === 'Off' && (
                                    <div style={{ background: 'var(--card-bg-light)', borderRadius: 12, padding: 16, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 10,
                                            background: selectedDayDetail.dayData.status === 'Holiday' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.05)',
                                            color: selectedDayDetail.dayData.status === 'Holiday' ? '#8b5cf6' : 'var(--text-dim)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <CalendarIcon size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Reason</div>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedDayDetail.dayData.label || selectedDayDetail.dayData.status}</div>
                                        </div>
                                    </div>
                                )}

                                {selectedDayDetail.dayData.status === 'Absent' && (
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px 16px', borderRadius: 12, fontSize: 13 }}>
                                        <AlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                                        <span>No attendance record or approved leave found for this day. Automatically marked as Absent.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer" style={{ padding: '16px 24px', background: 'var(--card-bg-light)' }}>
                            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setSelectedDayDetail(null)}>
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .calendar-table {
                    border-spacing: 0;
                }
                .calendar-row:hover td {
                    background-color: rgba(255,255,255,0.01) !important;
                }
                .calendar-row:hover td:first-child {
                    background-color: var(--card-bg-light) !important;
                }
                .calendar-cell:hover {
                    filter: brightness(1.1);
                    transform: scale(1.05);
                    z-index: 2;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                .animate-in {
                    animation: fadeIn 0.3s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
}

function AlertCircle({ size, style }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={style}
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    )
}
