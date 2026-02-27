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
    const [viewUserIds, setViewUserIds] = useState(location.state?.viewUserId ? [location.state?.viewUserId] : [])
    const [statusFilter, setStatusFilter] = useState(location.state?.statusFilter || '')
    const [allEntries, setAllEntries] = useState([])
    const [allUsers, setAllUsers] = useState([])
    const [allProjects, setAllProjects] = useState([])
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState(null)

    const loadUsers = async () => {
        try {
            const r = await api.get('/users')
            const sorted = r.data.data.sort((a, b) => a.full_name.localeCompare(b.full_name))
            setAllUsers(sorted)
            // Default to first user if nothing selected
            if (viewUserIds.length === 0 && sorted.length > 0) {
                const firstOther = sorted.find(u => u.id !== user?.id) || sorted[0]
                if (firstOther) setViewUserIds([firstOther.id])
            }
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
        if (viewUserIds.length > 0) load()
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
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th style={{ width: 150 }}>Date & Logged</th>
                                <th style={{ width: 140 }}>Employee</th>
                                <th style={{ width: 120 }}>Submitted Time</th>
                                <th>Activity Details & Feedback</th>
                                <th style={{ width: 130 }}>Status</th>
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
                                    return <tr><td colSpan={5}><div className="empty-state">No entries found for criteria</div></td></tr>;
                                }

                                return filtered.map(e => (
                                    <tr key={e.id}>
                                        <td>
                                            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>{fmt(e.date)}</div>
                                            <div style={{ fontWeight: 950, color: 'var(--accent)', fontSize: 18, marginTop: 4 }}>{e.hours_spent}</div>
                                        </td>
                                        <td style={{ fontWeight: 800 }}>{e.userName}</td>
                                        <td>
                                            <div style={{ fontSize: 11, fontWeight: 900, color: e.created_at ? 'var(--success)' : 'var(--text-dim)' }}>
                                                {e.created_at ? new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'NOT SUBMITTED'}
                                            </div>
                                        </td>
                                        <td className="col-project">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <span className="badge-pill badge-purple" style={{ fontSize: 10, fontWeight: 950 }}>
                                                        {(e.project?.name || e.task?.project?.name || 'In-House Project').toUpperCase()}
                                                    </span>
                                                    <div style={{ fontWeight: 900, fontSize: 16, color: '#000000' }}>{e.title}</div>
                                                </div>

                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.02)', padding: '8px 12px', borderRadius: 8, borderLeft: '3px solid var(--border)' }}>
                                                    {e.notes || 'No detailed notes provided.'}
                                                    {e.task && <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Link2 size={12} />{e.task.title}</div>}
                                                </div>

                                                {/* Admin Feedback Section integrated below */}
                                                <div style={{ marginTop: 12, padding: '12px', background: 'rgba(124, 58, 237, 0.03)', borderRadius: 10, border: '1px dashed var(--border)' }}>
                                                    <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <Clock size={12} /> Admin Guidance & Feedback
                                                    </div>
                                                    <textarea
                                                        className="form-input sm"
                                                        style={{ fontSize: 13, minHeight: 60, background: 'white', fontWeight: 700 }}
                                                        placeholder="Provide guidance or feedback to the developer..."
                                                        defaultValue={e.admin_feedback || ''}
                                                        onBlur={ev => handleUpdate(e.id, { admin_feedback: ev.target.value })}
                                                    />
                                                    {savingId === e.id && <div className="spinner-sm" style={{ marginTop: 8 }} />}
                                                    {e.developer_reply && (
                                                        <div className="dev-reply-pill" style={{ marginTop: 12, background: 'white' }}>
                                                            <span className="dev-reply-label">Dev Response:</span> {e.developer_reply}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge-pill ${STATUS_BADGE[e.status]}`} style={{ fontWeight: 800, padding: '6px 14px' }}>{e.status?.replace('_', ' ').toUpperCase()}</span>
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
                    max-height: 150px;
                    overflow-y: auto;
                }
                .chip {
                    font-size: 11px;
                    padding: 5px 14px;
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
                .modern-table { width: 100%; border-collapse: separate; border-spacing: 0; }
                .modern-table th { background: rgba(255, 255, 255, 0.02); padding: 14px 16px; text-align: left; font-size: 11px; text-transform: uppercase; color: var(--text-dim); letter-spacing: 0.05em; font-weight: 600; }
                .modern-table td { padding: 18px 16px; border-bottom: 1px solid var(--border); vertical-align: top; }
                .modern-table tr:hover td { background: var(--bg-card-hover); }
                .form-input.sm { font-size: 12px; padding: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; color: var(--text); transition: all 0.2s; }
                .form-input.sm:focus { border-color: var(--accent); outline: none; background: rgba(255,255,255,0.06); }
                .spinner-sm { width: 14px; height: 14px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
                .dev-reply-pill { margin-top: 8px; background: rgba(52, 211, 153, 0.1); color: #34d399; padding: 6px 10px; border-radius: 6px; font-size: 11px; border: 1px solid rgba(52, 211, 153, 0.2); }
                .dev-reply-label { font-weight: 700; text-transform: uppercase; margin-right: 4px; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}
