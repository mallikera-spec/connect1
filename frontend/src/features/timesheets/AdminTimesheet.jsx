import { useEffect, useState } from 'react'
import { Link2, Clock, Calendar, Users, Filter } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const STATUS_BADGE = { todo: 'badge-gray', in_progress: 'badge-yellow', done: 'badge-green', blocked: 'badge-red' }

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : ''
const todayISO = () => new Date().toISOString().slice(0, 10)

import DateRangePicker from '../../components/DateRangePicker'

export default function AdminTimesheet() {
    const { user } = useAuth()
    const location = useLocation()

    const [startDate, setStartDate] = useState(location.state?.startDate || todayISO())
    const [endDate, setEndDate] = useState(location.state?.endDate || todayISO())
    const [viewUserIds, setViewUserIds] = useState(
        location.state?.viewUserId ? [location.state.viewUserId] : []
        // empty = ALL users
    )
    const [statusFilter, setStatusFilter] = useState(location.state?.statusFilter || '')
    const [allEntries, setAllEntries] = useState([])
    const [allUsers, setAllUsers] = useState([])
    const [allProjects, setAllProjects] = useState([])
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState(null)

    const loadUsers = async () => {
        try {
            const r = await api.get('/users', { params: { role: 'developer' } })
            const sorted = r.data.data.sort((a, b) => a.full_name.localeCompare(b.full_name))
            setAllUsers(sorted)
            // Don't auto-select a single user — empty viewUserIds means "show all"
        } catch (_) { }
    }

    const loadProjects = async () => {
        try {
            const r = await api.get('/projects')
            setAllProjects(r.data.data)
        } catch (_) { }
    }

    const load = async () => {
        setLoading(true)
        try {
            const params = {
                startDate,
                endDate,
                // empty string = all users (backend handles it)
                userIds: viewUserIds.length > 0 ? viewUserIds.join(',') : ''
            }
            const tsRes = await api.get('/timesheets', { params });
            const timesheets = tsRes.data.data;
            const flattened = timesheets.flatMap(ts =>
                (ts.entries || []).map(entry => ({
                    ...entry,
                    userName: ts.user?.full_name,
                    userId: ts.user_id,
                    date: ts.work_date,
                    submittedAt: ts.submitted_at
                }))
            );
            setAllEntries(flattened.sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUsers()
        loadProjects()
    }, [])

    useEffect(() => {
        load()
    }, [startDate, endDate, viewUserIds])

    const handleUpdate = async (entryId, updates) => {
        setSavingId(entryId)
        try {
            await api.patch(`/timesheets/entries/${entryId}`, updates)
            setAllEntries(prev => prev.map(e => e.id === entryId ? { ...e, ...updates } : e))
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSavingId(null)
        }
    }

    const handleExportCSV = () => {
        if (allEntries.length === 0) return toast.error('No data to export');
        const headers = ['Date', 'Employee', 'Plan Submitted', 'Project', 'Activity', 'Hours', 'Status', 'Notes', 'Admin Feedback'];
        const rows = allEntries.map(e => [
            e.date,
            e.userName,
            e.submittedAt ? new Date(e.submittedAt).toLocaleTimeString('en-IN') : 'N/A',
            e.project?.name || e.task?.project?.name || 'In-House Project',
            e.title,
            e.hours_spent,
            e.status,
            (e.notes || '').replace(/\n/g, ' '),
            (e.admin_feedback || '').replace(/\n/g, ' ')
        ]);
        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `admin_timesheet_${startDate}.csv`);
        link.click();
    };

    const handleExportPDF = () => {
        window.print();
    };

    const toggleUser = (uid) => {
        setViewUserIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid])
    }

    return (
        <div style={{ width: '100%', padding: '0 20px' }}>
            <div className="page-header" style={{ alignItems: 'flex-start' }}>
                <div>
                    <h1>Team Supervision</h1>
                    <p>Review employee timesheets and provide guidance</p>
                </div>
                <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onRangeChange={(range) => {
                        setStartDate(range.startDate);
                        setEndDate(range.endDate);
                    }}
                />
            </div>

            {/* Filters Section */}
            <div className="card shadow-sm glass-card" style={{ marginBottom: 24, padding: 20 }}>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 2, minWidth: 300, marginBottom: 0 }}>
                        <label className="form-label">
                            <Users size={14} style={{ marginRight: 6 }} />
                            <strong>SELECT EMPLOYEES ({viewUserIds.length})</strong>
                        </label>
                        <div className="custom-multi-select">
                            {allUsers.map(u => (
                                <label key={u.id} className={`chip ${viewUserIds.includes(u.id) ? 'active' : ''}`}>
                                    <input type="checkbox" checked={viewUserIds.includes(u.id)} onChange={() => toggleUser(u.id)} hidden />
                                    {u.full_name}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
                        <label className="form-label">
                            <Filter size={14} style={{ marginRight: 6 }} />
                            <strong>FILTER BY PROJECT</strong>
                        </label>
                        <select className="form-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                            <option value="">All Projects</option>
                            {allProjects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="export-btns">
                        <button className="export-btn csv" onClick={handleExportCSV}>CSV</button>
                        <button className="export-btn pdf" onClick={handleExportPDF}>PDF</button>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="table-wrapper shadow-sm">
                {loading ? <div className="page-loader"><div className="spinner" /></div> : (
                    <table className="compact-ts-table">
                        <thead>
                            <tr>
                                <th style={{ width: 100 }}>Date</th>
                                <th style={{ width: 60 }}>Hrs</th>
                                <th style={{ width: 130 }}>Employee</th>
                                <th style={{ width: 120 }}>Project</th>
                                <th>Task / Notes</th>
                                <th style={{ width: 90 }}>Submitted</th>
                                <th style={{ width: 110 }}>Status</th>
                                <th style={{ width: 220 }}>Feedback</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                let filtered = allEntries;
                                if (selectedProjectId) {
                                    filtered = filtered.filter(e =>
                                        e.project_id === selectedProjectId ||
                                        e.task?.project_id === selectedProjectId
                                    );
                                }
                                if (statusFilter) {
                                    filtered = filtered.filter(e => e.status === statusFilter);
                                }

                                if (filtered.length === 0) {
                                    return <tr><td colSpan={8}><div className="empty-state">No entries found for criteria</div></td></tr>;
                                }

                                return filtered.map(e => (
                                    <tr key={e.id}>
                                        <td>
                                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                                                {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </div>
                                            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                                                {new Date(e.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 15 }}>{e.hours_spent}</span>
                                            <span style={{ fontSize: 9, color: 'var(--text-dim)', marginLeft: 2 }}>h</span>
                                        </td>
                                        <td style={{ fontSize: 12, fontWeight: 600 }}>{e.userName}</td>
                                        <td>
                                            <span className="badge-pill badge-purple" style={{ fontSize: 9, padding: '2px 7px', fontWeight: 700 }}>
                                                {(e.project?.name || e.task?.project?.name || 'In-House').toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{e.title}</div>
                                            {e.notes && (
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {e.notes}
                                                </div>
                                            )}
                                            {e.developer_reply && (
                                                <div style={{ fontSize: 10, color: '#34d399', marginTop: 2, fontWeight: 600 }}>
                                                    ↩ {e.developer_reply}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ fontSize: 11, color: e.created_at ? 'var(--success)' : 'var(--text-dim)', fontWeight: 600 }}>
                                            {e.created_at ? new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </td>
                                        <td>
                                            <span className={`badge-pill ${STATUS_BADGE[e.status]}`} style={{ fontSize: 10, padding: '3px 9px', fontWeight: 700 }}>
                                                {e.status?.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    className="feedback-input"
                                                    placeholder={e.admin_feedback ? '' : 'Add feedback…'}
                                                    defaultValue={e.admin_feedback || ''}
                                                    onBlur={ev => handleUpdate(e.id, { admin_feedback: ev.target.value })}
                                                    title={e.admin_feedback || 'Add admin feedback'}
                                                />
                                                {savingId === e.id && <div className="spinner-sm" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }} />}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            })()}
                        </tbody>
                    </table>
                )}
            </div>

            <style>{`
                .custom-multi-select {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.02);
                    padding: 12px;
                    border-radius: 12px;
                    border: 1px solid var(--border);
                    max-height: 120px;
                    overflow-y: auto;
                }
                .chip {
                    font-size: 11px;
                    padding: 4px 12px;
                    border-radius: 100px;
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: var(--text-muted);
                    font-weight: 500;
                }
                .chip:hover { border-color: var(--accent-light); color: var(--text); }
                .chip.active {
                    background: rgba(124, 58, 237, 0.15);
                    border-color: var(--accent);
                    color: var(--accent-light);
                    font-weight: 600;
                }
                .compact-ts-table { width: 100%; border-collapse: collapse; }
                .compact-ts-table th {
                    background: rgba(255,255,255,0.02);
                    padding: 9px 12px;
                    text-align: left;
                    font-size: 10px;
                    text-transform: uppercase;
                    color: var(--text-dim);
                    letter-spacing: 0.05em;
                    font-weight: 700;
                    border-bottom: 2px solid var(--border);
                    white-space: nowrap;
                }
                .compact-ts-table td {
                    padding: 8px 12px;
                    border-bottom: 1px solid var(--border);
                    vertical-align: middle;
                }
                .compact-ts-table tr:hover td { background: var(--bg-card-hover, rgba(255,255,255,0.02)); }
                .feedback-input {
                    width: 100%;
                    font-size: 11px;
                    padding: 5px 8px;
                    background: rgba(124,58,237,0.04);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    color: var(--text);
                    outline: none;
                    transition: border-color 0.2s;
                }
                .feedback-input:focus { border-color: var(--accent); background: rgba(124,58,237,0.08); }
                .spinner-sm { width: 12px; height: 12px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}


