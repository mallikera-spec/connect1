import { useState, useEffect, useMemo } from 'react';
import { Users, Briefcase, Clock, Calendar, Filter, X, BarChart2, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../../lib/api';
import DateRangePicker from '../../components/DateRangePicker';
import toast from 'react-hot-toast';

const COLORS = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2','#7c3aed','#be185d'];

const firstOfMonth = () => new Date(new Date().setDate(1)).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);

function Avatar({ name, color }) {
    return (
        <div style={{
            width: 28, height: 28, borderRadius: '50%', background: color + '22',
            border: `2px solid ${color}`, color, fontWeight: 700, fontSize: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
            {name?.[0]?.toUpperCase()}
        </div>
    );
}

export default function AdminDevCalendar() {
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(firstOfMonth());
    const [endDate, setEndDate] = useState(today());
    const [allUsers, setAllUsers] = useState([]);
    const [allProjects, setAllProjects] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [timesheets, setTimesheets] = useState([]);
    const [expandedDays, setExpandedDays] = useState({});

    useEffect(() => {
        Promise.all([api.get('/users'), api.get('/projects')])
            .then(([u, p]) => {
                setAllUsers(u.data.data || []);
                setAllProjects(p.data.data || []);
            })
            .catch(err => toast.error(err.message));
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const params = {
                startDate,
                endDate,
                userIds: selectedUserIds.length > 0 ? selectedUserIds.join(',') : '',
            };
            const res = await api.get('/timesheets', { params });
            setTimesheets(res.data.data || []);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [startDate, endDate, selectedUserIds]);

    // Flatten timesheets into entries with date, user, project, hours
    const entries = useMemo(() => {
        const flat = [];
        timesheets.forEach(ts => {
            (ts.entries || []).forEach(e => {
                const projectName = e.project?.name || e.task?.project?.name || 'In-House';
                const projectId = e.project_id || e.task?.project_id || '';
                if (selectedProjectId && projectId !== selectedProjectId) return;
                flat.push({
                    date: ts.work_date,
                    userId: ts.user_id,
                    userName: ts.user?.full_name || '—',
                    projectName,
                    projectId,
                    hours: parseFloat(e.hours_spent) || 0,
                    title: e.title,
                    status: e.status,
                    entryId: e.id,
                });
            });
        });
        return flat;
    }, [timesheets, selectedProjectId]);

    // Group by date → then by developer
    const byDay = useMemo(() => {
        const map = {};
        entries.forEach(e => {
            if (!map[e.date]) map[e.date] = {};
            if (!map[e.date][e.userId]) map[e.date][e.userId] = { userName: e.userName, projects: {}, totalHours: 0, userId: e.userId };
            if (!map[e.date][e.userId].projects[e.projectId]) {
                map[e.date][e.userId].projects[e.projectId] = { name: e.projectName, hours: 0, entries: [] };
            }
            map[e.date][e.userId].projects[e.projectId].hours += e.hours;
            map[e.date][e.userId].projects[e.projectId].entries.push(e);
            map[e.date][e.userId].totalHours += e.hours;
        });
        return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])); // newest first
    }, [entries]);

    const totalHours = entries.reduce((s, e) => s + e.hours, 0);
    const totalManDays = totalHours / 8;
    const activeDev = new Set(entries.map(e => e.userId)).size;

    const toggleDay = (date) => setExpandedDays(p => ({ ...p, [date]: !p[date] }));
    const toggleUser = (uid) => setSelectedUserIds(p => p.includes(uid) ? p.filter(x => x !== uid) : [...p, uid]);

    const getUserColor = (userId) => COLORS[allUsers.findIndex(u => u.id === userId) % COLORS.length] || '#7c3aed';

    const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    const fmtH = (h) => `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {/* Header */}
            <div className="page-header" style={{ alignItems: 'flex-start' }}>
                <div>
                    <h1>Developer Calendar</h1>
                    <p>See who worked on what project, day-by-day</p>
                </div>
                <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onRangeChange={({ startDate: s, endDate: e }) => { setStartDate(s); setEndDate(e); }}
                />
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 24 }}>
                {[
                    { icon: Clock, label: 'Total Hours', value: `${totalHours.toFixed(1)}h`, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
                    { icon: BarChart2, label: 'Man-Days (8h)', value: totalManDays.toFixed(2), color: '#059669', bg: 'rgba(5,150,105,0.08)' },
                    { icon: Users, label: 'Active Developers', value: activeDev, color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                    <div key={label} className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ background: bg, color, padding: 10, borderRadius: 10 }}><Icon size={22} /></div>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Panel */}
            <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    {/* Developer filter */}
                    <div className="form-group" style={{ flex: 2, minWidth: 300, marginBottom: 0 }}>
                        <label className="form-label">
                            <Users size={13} style={{ marginRight: 6 }} />
                            <strong>FILTER BY DEVELOPER</strong>
                            {selectedUserIds.length > 0 && <span style={{ marginLeft: 8, color: 'var(--accent)', fontSize: 11 }}>({selectedUserIds.length} selected)</span>}
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8 }}>
                            {allUsers.map(u => {
                                const isActive = selectedUserIds.includes(u.id);
                                const color = getUserColor(u.id);
                                return (
                                    <label key={u.id} onClick={() => toggleUser(u.id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, fontSize: 12, cursor: 'pointer', userSelect: 'none',
                                            background: isActive ? color + '22' : 'var(--bg-card)', border: `1px solid ${isActive ? color : 'var(--border)'}`, color: isActive ? color : 'var(--text-muted)', fontWeight: isActive ? 600 : 400 }}>
                                        {u.full_name}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Project filter */}
                    <div className="form-group" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
                        <label className="form-label"><Briefcase size={13} style={{ marginRight: 6 }} /><strong>PROJECT</strong></label>
                        <select className="form-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                            <option value="">All Projects</option>
                            {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedUserIds([]); setSelectedProjectId(''); }}
                        style={{ height: 36, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <X size={13} /> Clear
                    </button>
                </div>
            </div>

            {/* Day-by-day timeline */}
            {loading ? <div className="page-loader"><div className="spinner" /></div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {byDay.length === 0 ? (
                        <div className="empty-state"><p>No timesheet data for this period</p></div>
                    ) : byDay.map(([date, devMap]) => {
                        const isOpen = expandedDays[date] !== false; // default open
                        const totalDayHours = Object.values(devMap).reduce((s, d) => s + d.totalHours, 0);
                        const devCount = Object.keys(devMap).length;

                        return (
                            <div key={date} style={{ background: 'var(--bg-card, rgba(255,255,255,0.03))', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                                {/* Day header */}
                                <button onClick={() => toggleDay(date)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                                    {isOpen ? <ChevronDown size={16} style={{ color: 'var(--accent)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                                    <Calendar size={15} style={{ color: 'var(--accent)' }} />
                                    <span style={{ fontWeight: 700, fontSize: 14 }}>{fmtDate(date)}</span>
                                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: 12 }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{devCount} developer{devCount > 1 ? 's' : ''}</span>
                                        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{fmtH(totalDayHours)}</span>
                                    </span>
                                    {/* Developer avatars preview */}
                                    <div style={{ display: 'flex', gap: -4 }}>
                                        {Object.values(devMap).slice(0, 5).map(d => (
                                            <Avatar key={d.userId} name={d.userName} color={getUserColor(d.userId)} />
                                        ))}
                                    </div>
                                </button>

                                {/* Expanded developer rows */}
                                {isOpen && (
                                    <div style={{ borderTop: '1px solid var(--border)' }}>
                                        {Object.values(devMap).map((dev) => {
                                            const color = getUserColor(dev.userId);
                                            const projectList = Object.values(dev.projects);
                                            return (
                                                <div key={dev.userId} style={{ display: 'grid', gridTemplateColumns: '220px 1fr auto', gap: 0, padding: '12px 18px 12px 40px', borderBottom: '1px solid var(--border)', alignItems: 'start' }}>
                                                    {/* Dev name */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <Avatar name={dev.userName} color={color} />
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: 13, color }}>{dev.userName}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtH(dev.totalHours)}</div>
                                                        </div>
                                                    </div>

                                                    {/* Projects breakdown */}
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                        {projectList.map(proj => (
                                                            <div key={proj.name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 12 }}>
                                                                <span style={{ fontWeight: 600 }}>{proj.name}</span>
                                                                <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{fmtH(proj.hours)}</span>
                                                                <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                                    {proj.entries.map(e => (
                                                                        <span key={e.entryId} style={{ fontSize: 10, background: color + '15', color, border: `1px solid ${color}33`, borderRadius: 4, padding: '1px 6px' }}>
                                                                            {e.title}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Hours badge */}
                                                    <div style={{ textAlign: 'right', fontWeight: 700, color, fontSize: 14 }}>
                                                        {fmtH(dev.totalHours)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
