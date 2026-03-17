import React, { useState, useEffect } from 'react';
import { 
    Calendar as CalendarIcon, 
    ChevronLeft, 
    ChevronRight, 
    Loader2, 
    Search,
    Clock,
    AlertCircle,
    CheckCircle2,
    Info,
    X
} from 'lucide-react';
import { HRService } from '../HRService';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

const DayDetailModal = ({ isOpen, onClose, dayData, date, employeeName }) => {
    if (!isOpen || !dayData) return null;

    const getStatusStyles = (status, isHalfDay) => {
        if (status === 'Approved Leave' && isHalfDay) {
            return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', icon: Info };
        }
        switch (status) {
            case 'Present': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', icon: CheckCircle2 };
            case 'Approved Leave': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', icon: CheckCircle2 };
            case 'Half Day': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', icon: Info };
            case 'Holiday': return { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', icon: CalendarIcon };
            case 'Week Off': return { bg: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)', icon: CalendarIcon };
            case 'WFH': return { bg: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6', icon: CalendarIcon };
            case 'Absent': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', icon: AlertCircle };
            default: return { bg: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)', icon: Info };
        }
    };

    const styles = getStatusStyles(dayData.status, dayData.is_half_day);
    const StatusIcon = styles.icon;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: 20
        }} onClick={onClose}>
            <div style={{
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: 20, width: '100%', maxWidth: 450, overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{date}</div>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{employeeName}</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer', color: 'var(--text-dim)' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '0 24px 24px' }}>
                    <div style={{ 
                        background: styles.bg, color: styles.color,
                        padding: '12px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
                        marginBottom: 24, border: `1px solid ${styles.color}20`
                    }}>
                        <StatusIcon size={24} />
                        <div>
                            <div style={{ fontSize: 10, opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>Status</div>
                            <div style={{ fontWeight: 800, fontSize: 18 }}>{dayData.status}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: 16 }}>
                        {dayData.type === 'Attendance' && (
                            <div style={{ background: 'var(--card-bg-light)', borderRadius: 12, padding: 16, border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <Clock size={16} style={{ color: 'var(--accent)' }} />
                                    <div>
                                        <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Check In</div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                                            {dayData.check_in_time ? new Date(dayData.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <Clock size={16} style={{ color: 'var(--danger)' }} />
                                    <div>
                                        <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Check Out</div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                                            {dayData.check_out_time ? new Date(dayData.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {dayData.type === 'Leave' && (
                            <div style={{ background: 'var(--card-bg-light)', borderRadius: 12, padding: 16, border: '1px solid var(--border)', display: 'grid', gap: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Type</div>
                                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{dayData.leave_type}</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Duration</div>
                                    <div style={{ fontWeight: 600, fontSize: 14, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: 4 }}>
                                        {dayData.is_half_day ? 'Half Day' : 'Full Day'}
                                    </div>
                                </div>
                                {dayData.is_half_day && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Session</div>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{dayData.session || '—'}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {dayData.type === 'Off' && (
                            <div style={{ background: 'var(--card-bg-light)', borderRadius: 12, padding: 16, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ 
                                    width: 40, height: 40, borderRadius: 10, 
                                    background: dayData.status === 'Holiday' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.05)',
                                    color: dayData.status === 'Holiday' ? '#8b5cf6' : 'var(--text-dim)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <CalendarIcon size={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Reason</div>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{dayData.label || dayData.status}</div>
                                </div>
                            </div>
                        )}

                        {dayData.status === 'Absent' && (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px 16px', borderRadius: 12, fontSize: 13 }}>
                                <AlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                                <div>This day is marked as absent because no attendance record or approved leave was found. This may result in a salary deduction.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function PersonalAttendanceCalendar() {
    const { user } = useAuth();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDayDetail, setSelectedDayDetail] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await HRService.getMyAttendanceCalendar(month, year);
            if (res.data && res.data.length > 0) {
                setData(res.data[0]);
            } else {
                setData(null);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load attendance data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [month, year]);

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
        if (dayData.type === 'Attendance') {
            return { bg: '#3b82f6', color: '#fff', text: 'P' };
        }
        if (dayData.type === 'Leave') {
            // Approved half-day leave shows amber like attendance half day
            return dayData.is_half_day
                ? { bg: '#f59e0b', color: '#fff', text: 'HL' }
                : { bg: '#10b981', color: '#fff', text: 'L' };
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
        if (dayData.status === 'Absent') {
            return { bg: '#ef4444', color: '#fff', text: 'A' };
        }
        return { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)', text: '?' };
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>My Attendance</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0 }}>Track your daily attendance, leaves, and holidays.</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--card-bg-light)', padding: '6px 12px', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <button 
                        onClick={handlePrevMonth}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center' }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span style={{ fontWeight: 700, fontSize: 14, minWidth: 120, textAlign: 'center' }}>
                        {monthNames[month - 1]} {year}
                    </span>
                    <button 
                        onClick={handleNextMonth}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center' }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="card polished-card" style={{ padding: 24 }}>
                <div className="calendar-legend" style={{ display: 'flex', gap: 20, marginBottom: 24, fontSize: 12, color: 'var(--text-dim)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#3b82f6' }}></div>
                        <span>Present</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981' }}></div>
                        <span>Approved Leave</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#f59e0b' }}></div>
                        <span>Half Day</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#8b5cf6' }}></div>
                        <span>Holiday</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.08)' }}></div>
                        <span>Week Off</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#14b8a6' }}></div>
                        <span>WFH</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#ef4444' }}></div>
                        <span>Absent</span>
                    </div>
                </div>

                <div 
                    className="personal-calendar-grid" 
                    style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(7, 1fr)', 
                        gap: 12,
                        marginTop: 10
                    }}
                >
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', paddingBottom: 8 }}>
                            {day}
                        </div>
                    ))}

                    {/* Empty cells before 1st of month */}
                    {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}

                    {days.map(d => {
                        const dayData = data?.days?.[d];
                        const styles = getStatusStyles(dayData);
                        const dateObj = new Date(year, month - 1, d);
                        const isToday = new Date().toDateString() === dateObj.toDateString();

                        return (
                            <div 
                                key={d}
                                onClick={() => dayData && setSelectedDayDetail({ dayData, day: d })}
                                style={{ 
                                    aspectRatio: '1/1',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: isToday ? 'rgba(var(--accent-rgb), 0.1)' : 'var(--card-bg-light)',
                                    border: isToday ? '1px solid var(--accent)' : '1px solid var(--border)',
                                    borderRadius: 12,
                                    cursor: dayData ? 'pointer' : 'default',
                                    position: 'relative',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    overflow: 'hidden'
                                }}
                                className="calendar-day-cell"
                            >
                                <span style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, zIndex: 2 }}>{d}</span>
                                {dayData && (
                                    <div style={{ 
                                        width: 24, height: 24, borderRadius: 6, 
                                        background: styles.bg, color: styles.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 10, fontWeight: 800, zIndex: 2
                                    }}>
                                        {styles.text}
                                    </div>
                                )}
                                {isToday && (
                                    <div style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <DayDetailModal 
                isOpen={!!selectedDayDetail}
                onClose={() => setSelectedDayDetail(null)}
                dayData={selectedDayDetail?.dayData}
                date={`${selectedDayDetail?.day} ${monthNames[month-1]} ${year}`}
                employeeName={user.full_name}
            />

            <style>{`
                .calendar-day-cell:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    border-color: var(--accent) !important;
                }
                @media (max-width: 768px) {
                    .personal-calendar-grid {
                        gap: 8px;
                    }
                }
            `}</style>
        </div>
    );
}
