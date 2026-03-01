import { useEffect, useState } from 'react'
import { Link2, Clock, Calendar, Users, Filter, ShieldCheck, AlertCircle, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const STATUS_BADGE = {
    todo: 'badge-gray',
    in_progress: 'badge-yellow',
    done: 'badge-green',
    blocked: 'badge-red',
    verified: 'badge-purple',
    failed: 'badge-red'
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : ''
const todayISO = () => new Date().toISOString().slice(0, 10)

import DateRangePicker from '../../components/DateRangePicker'

export default function AdminTimesheet() {
    const { hasRole, user } = useAuth()
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
    const [modal, setModal] = useState(null)
    const [selectedEntry, setSelectedEntry] = useState(null)
    const [qaReport, setQaReport] = useState({ status: '', notes: '' })

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

            let filtered = flattened;
            if (statusFilter) {
                filtered = flattened.filter(e => e.status === statusFilter);
            }

            setAllEntries(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (location.state) {
            if (location.state.startDate) setStartDate(location.state.startDate);
            if (location.state.endDate) setEndDate(location.state.endDate);
            if (location.state.viewUserId) setViewUserIds([location.state.viewUserId]);
            if (location.state.statusFilter !== undefined) setStatusFilter(location.state.statusFilter);
        }
    }, [location.state]);

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

    const openQaModal = (entry, status) => {
        setSelectedEntry(entry)
        setQaReport({ status, notes: entry.qa_notes || '' })
        setModal('qa_report')
    }

    const handleQaReport = async (e) => {
        e.preventDefault()
        if (!selectedEntry) return

        setSavingId(selectedEntry.id)
        try {
            const updates = {
                status: qaReport.status,
                qa_notes: qaReport.notes
            }
            await api.patch(`/timesheets/entries/${selectedEntry.id}`, updates)
            setAllEntries(prev => prev.map(e => e.id === selectedEntry.id ? { ...e, ...updates } : e))
            toast.success(`Todo marked as ${qaReport.status}`)
            setModal(null)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSavingId(null)
        }
    }

    const handleExportCSV = () => {
        if (allEntries.length === 0) return toast.error('No data to export');
        const headers = ['Date', 'Employee', 'Plan Submitted', 'Project', 'Activity', 'Hours', 'Status', 'QA Result', 'QA Notes', 'Admin Feedback'];
        const rows = allEntries.map(e => [
            e.date,
            e.userName,
            e.submittedAt ? new Date(e.submittedAt).toLocaleTimeString('en-IN') : 'N/A',
            e.project?.name || e.task?.project?.name || 'In-House Project',
            e.title,
            e.hours_spent,
            e.status,
            ['verified', 'failed'].includes(e.status) ? e.status.toUpperCase() : 'PENDING',
            (e.qa_notes || '').replace(/\n/g, ' '),
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
                                <th style={{ width: 120 }}>QA Result</th>
                                <th style={{ width: 180 }}>QA Notes</th>
                                <th style={{ width: 200 }}>Admin Feedback</th>
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
                                            {e.status === 'verified' && <span className="badge-pill badge-green" style={{ fontSize: '9px' }}>PASSED</span>}
                                            {e.status === 'failed' && <span className="badge-pill badge-red" style={{ fontSize: '9px' }}>FAILED</span>}
                                            {!['verified', 'failed'].includes(e.status) && <span style={{ opacity: 0.3 }}>—</span>}
                                        </td>
                                        <td style={{ fontSize: 10, color: e.status === 'verified' ? 'var(--text-muted)' : '#fb7185', fontWeight: 600 }}>
                                            {e.qa_notes ? `🚩 ${e.qa_notes}` : <span style={{ opacity: 0.3 }}>—</span>}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ position: 'relative', flex: 1 }}>
                                                    <input
                                                        className="feedback-input"
                                                        placeholder={e.admin_feedback ? '' : 'Add feedback…'}
                                                        defaultValue={e.admin_feedback || ''}
                                                        onBlur={ev => handleUpdate(e.id, { admin_feedback: ev.target.value })}
                                                        title={e.admin_feedback || 'Add admin feedback'}
                                                    />
                                                    {savingId === e.id && modal !== 'qa_report' && <div className="spinner-sm" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }} />}
                                                </div>

                                                {/* Tester Actions */}
                                                {(hasRole('Tester') || hasRole('super_admin')) && (e.status === 'done' || e.status === 'verified' || e.status === 'failed') && (
                                                    <div style={{ display: 'flex', gap: 4 }}>
                                                        <button
                                                            className={`btn-icon-ts ${e.status === 'verified' ? 'active-pass' : ''}`}
                                                            onClick={() => openQaModal(e, 'verified')}
                                                            title="Pass / Verify"
                                                        >
                                                            <ShieldCheck size={16} />
                                                        </button>
                                                        <button
                                                            className={`btn-icon-ts ${e.status === 'failed' ? 'active-fail' : ''}`}
                                                            onClick={() => openQaModal(e, 'failed')}
                                                            title="Fail / Rejected"
                                                        >
                                                            <AlertCircle size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            })()}
                        </tbody>
                    </table>
                )}
            </div>

            {/* QA Report Modal */}
            {modal === 'qa_report' && selectedEntry && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
                    <div className="modal" style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <h2 className="modal-title">QA Report: {qaReport.status === 'verified' ? 'Pass' : 'Fail'}</h2>
                            <button className="btn-icon" onClick={() => setModal(null)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleQaReport}>
                            <div className="modal-body">
                                <p style={{ fontSize: 13, marginBottom: 12, color: 'var(--text-muted)' }}>
                                    Todo: <strong>{selectedEntry.title}</strong>
                                </p>
                                <div className="form-group">
                                    <label className="form-label">QA Notes / Reason</label>
                                    <textarea
                                        className="form-textarea"
                                        style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
                                        rows={4}
                                        value={qaReport.notes}
                                        onChange={e => setQaReport(p => ({ ...p, notes: e.target.value }))}
                                        placeholder={qaReport.status === 'verified' ? 'Optional: Testing notes...' : 'Required: Why did it fail?'}
                                        required={qaReport.status === 'failed'}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                                <button
                                    type="submit"
                                    className={`btn ${qaReport.status === 'verified' ? 'btn-success' : 'btn-danger'}`}
                                    disabled={savingId === selectedEntry.id}
                                    style={{
                                        padding: '8px 20px',
                                        borderRadius: 8,
                                        fontWeight: 600,
                                        background: qaReport.status === 'verified' ? '#10b981' : '#ef4444',
                                        color: '#fff',
                                        border: 'none'
                                    }}
                                >
                                    {savingId === selectedEntry.id ? 'Saving...' : `Submit ${qaReport.status === 'verified' ? 'Pass' : 'Fail'}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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

                .btn-icon-ts {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid var(--border);
                    color: var(--text-dim);
                    padding: 5px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .btn-icon-ts:hover { background: rgba(255, 255, 255, 0.08); color: var(--text); border-color: var(--accent-light); }
                .btn-icon-ts.active-pass { background: rgba(16, 185, 129, 0.2); color: #10b981; border-color: #10b981; }
                .btn-icon-ts.active-fail { background: rgba(239, 68, 68, 0.2); color: #ef4444; border-color: #ef4444; }

                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.75);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal {
                    background: #1a1635;
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    width: 100%;
                    max-width: 500px;
                    overflow: hidden;
                }
                .modal-header {
                    padding: 16px 24px;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-body { padding: 24px; }
                .btn-icon { background: none; border: none; color: var(--text-dim); cursor: pointer; }
                .btn-icon:hover { color: var(--text); }
            `}</style>
        </div>
    )
}


