import { useEffect, useState } from 'react'
import { Link2, Clock, Calendar, Users, Filter, ShieldCheck, AlertCircle, X, Trash2 } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import QAFeedbackTrail from '../../components/common/QAFeedbackTrail'
import DataTable from '../../components/common/DataTable'

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
    const [qaFilter, setQaFilter] = useState('')
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

            setAllEntries(flattened.sort((a, b) => new Date(b.date) - new Date(a.date)));
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

    const handleDeleteEntry = async (id) => {
        if (!confirm('Are you sure you want to delete this timesheet entry?')) return
        try {
            await api.delete(`/timesheets/entries/${id}`)
            setAllEntries(prev => prev.filter(e => e.id !== id))
            toast.success('Entry deleted successfully')
        } catch (err) {
            toast.error(err.message)
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

            // Add to feedback trail
            await api.post(`/timesheets/entries/${selectedEntry.id}/feedback`, {
                content: qaReport.notes || (qaReport.status === 'verified' ? 'Verified by QA' : 'Failed QA'),
                new_status: qaReport.status
            });

            setAllEntries(prev => prev.map(e => e.id === selectedEntry.id ? { ...e, ...updates } : e))
            toast.success(`Todo marked as ${qaReport.status}`)
            setModal(null)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSavingId(null)
        }
    }

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

                    <div className="form-group" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
                        <label className="form-label">
                            <Clock size={14} style={{ marginRight: 6 }} />
                            <strong>FILTER BY STATUS</strong>
                        </label>
                        <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">All Statuses</option>
                            {['todo', 'in_progress', 'done', 'blocked', 'verified', 'failed'].map(s => (
                                <option key={s} value={s}>{s.toUpperCase().replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
                        <label className="form-label">
                            <ShieldCheck size={14} style={{ marginRight: 6 }} />
                            <strong>QA RESULT</strong>
                        </label>
                        <select className="form-select" value={qaFilter} onChange={e => setQaFilter(e.target.value)}>
                            <option value="">All QA Results</option>
                            <option value="passed">PASSED</option>
                            <option value="failed">FAILED</option>
                            <option value="pending">PENDING</option>
                        </select>
                    </div>
                </div>

                <div className="export-btns" style={{ display: 'none' }}>
                    {/* DataTable already provides these */}
                </div>
            </div>

            <div style={{ marginBottom: 40 }}>
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
                    if (qaFilter) {
                        if (qaFilter === 'passed') {
                            filtered = filtered.filter(e => e.status === 'verified');
                        } else if (qaFilter === 'failed') {
                            filtered = filtered.filter(e => e.status === 'failed');
                        } else if (qaFilter === 'pending') {
                            filtered = filtered.filter(e => !['verified', 'failed'].includes(e.status));
                        }
                    }

                    return (
                        <DataTable
                            loading={loading}
                            data={filtered}
                            fileName={`admin_timesheet_${startDate}`}
                            columns={[
                                {
                                    label: 'Date',
                                    key: 'date',
                                    render: (val) => (
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{new Date(val).toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                                        </div>
                                    ),
                                    exportValue: (val) => val
                                },
                                {
                                    label: 'Hrs',
                                    key: 'hours_spent',
                                    render: (val) => (
                                        <span>
                                            <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 15 }}>{val}</span>
                                            <span style={{ fontSize: 9, color: 'var(--text-dim)', marginLeft: 2 }}>h</span>
                                        </span>
                                    )
                                },
                                { label: 'Employee', key: 'userName', render: (val) => <span style={{ fontSize: 12, fontWeight: 600 }}>{val}</span> },
                                { label: 'Project', key: 'project.name', render: (val) => <span className="badge-pill badge-purple" style={{ fontSize: 9, padding: '2px 7px', fontWeight: 700 }}>{(val || 'In-House').toUpperCase()}</span> },
                                {
                                    label: 'Task / Notes',
                                    key: 'title',
                                    render: (val, e) => (
                                        <div style={{ maxWidth: 360 }}>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{val}</div>
                                            {e.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.notes}</div>}
                                            {e.developer_reply && <div style={{ fontSize: 10, color: '#34d399', marginTop: 2, fontWeight: 600 }}>↩ {e.developer_reply}</div>}
                                        </div>
                                    )
                                },
                                {
                                    label: 'Submitted',
                                    key: 'created_at',
                                    render: (val) => <span style={{ fontSize: 11, color: val ? 'var(--success)' : 'var(--text-dim)', fontWeight: 600 }}>{val ? new Date(val).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>,
                                    exportValue: (val) => val ? new Date(val).toLocaleTimeString('en-IN') : 'N/A'
                                },
                                { label: 'Status', key: 'status', render: (val) => <span className={`badge-pill ${STATUS_BADGE[val]}`} style={{ fontSize: 10, padding: '3px 9px', fontWeight: 700 }}>{val?.replace('_', ' ').toUpperCase()}</span> },
                                {
                                    label: 'QA Result',
                                    key: 'status',
                                    render: (val) => {
                                        if (val === 'verified') return <span className="badge-pill badge-green" style={{ fontSize: '9px' }}>PASSED</span>;
                                        if (val === 'failed') return <span className="badge-pill badge-red" style={{ fontSize: '9px' }}>FAILED</span>;
                                        return <span style={{ opacity: 0.3 }}>—</span>;
                                    },
                                    exportValue: (val) => val === 'verified' ? 'PASSED' : val === 'failed' ? 'FAILED' : 'PENDING'
                                },
                                { label: 'QA Notes', key: 'qa_notes', render: (val, e) => <span style={{ fontSize: 10, color: e.status === 'verified' ? 'var(--text-muted)' : '#fb7185', fontWeight: 600 }}>{val ? `🚩 ${val}` : <span style={{ opacity: 0.3 }}>—</span>}</span> },
                                {
                                    label: 'Admin Feedback',
                                    key: 'admin_feedback',
                                    render: (val, e) => (
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                className="feedback-input"
                                                placeholder={val ? '' : 'Add feedback…'}
                                                defaultValue={val || ''}
                                                onBlur={ev => handleUpdate(e.id, { admin_feedback: ev.target.value })}
                                                title={val || 'Add admin feedback'}
                                            />
                                            {savingId === e.id && modal !== 'qa_report' && <div className="spinner-sm" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }} />}
                                        </div>
                                    )
                                },
                                {
                                    label: 'Actions',
                                    key: 'id',
                                    render: (_, e) => (
                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                            {(hasRole('Tester') || hasRole('super_admin') || hasRole('director') || hasRole('Director')) && (e.status === 'done' || e.status === 'verified' || e.status === 'failed') && (
                                                <>
                                                    <button className={`btn-icon-ts ${e.status === 'verified' ? 'active-pass' : ''}`} onClick={() => openQaModal(e, 'verified')} title="Pass / Verify"><ShieldCheck size={16} /></button>
                                                    <button className={`btn-icon-ts ${e.status === 'failed' ? 'active-fail' : ''}`} onClick={() => openQaModal(e, 'failed')} title="Fail / Rejected"><AlertCircle size={16} /></button>
                                                </>
                                            )}
                                            {(hasRole('super_admin') || hasRole('director') || hasRole('Director')) && (
                                                <button className="btn-icon-ts danger-hover" onClick={() => handleDeleteEntry(e.id)} title="Delete Entry" style={{ color: 'var(--text-dim)' }}><Trash2 size={16} /></button>
                                            )}
                                        </div>
                                    )
                                }
                            ]}
                        />
                    );
                })()}
            </div>

            {/* QA Report Modal */}
            {modal === 'qa_report' && selectedEntry && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
                    <div className="modal modal-lg" style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Verification Report: {qaReport.status === 'verified' ? 'Pass' : 'Fail'}</h2>
                            <button className="btn-icon" onClick={() => setModal(null)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleQaReport} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                            <div className="modal-body split-body">
                                {/* Left Side: History */}
                                <div className="history-panel" style={{ padding: '32px', background: 'rgba(0,0,0,0.1)', borderRight: '1px solid var(--border)', overflowY: 'auto', maxHeight: '60vh' }}>
                                    <h4 className="modal-subtitle">Communication Logs</h4>
                                    <div className="data-item full" style={{ marginBottom: 20 }}>
                                        <p className="emphasis-text" style={{ fontSize: '16px', marginBottom: 8 }}>{selectedEntry.title}</p>
                                        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>
                                            <span><strong>Dev:</strong> {selectedEntry.userName}</span>
                                            <span><strong>Project:</strong> {selectedEntry.project?.name || 'In-House'}</span>
                                        </div>
                                        {selectedEntry.notes && (
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', fontStyle: 'italic', marginBottom: 12, lineHeight: '1.5' }}>
                                                <strong style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4, fontStyle: 'normal' }}>Developer Note:</strong>
                                                {selectedEntry.notes}
                                            </div>
                                        )}
                                        {selectedEntry.developer_reply && (
                                            <div style={{ fontSize: '13px', color: 'var(--accent-light)', background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: 12, lineHeight: '1.5' }}>
                                                <strong style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4, fontStyle: 'normal' }}>Resubmit Reply:</strong>
                                                {selectedEntry.developer_reply}
                                            </div>
                                        )}
                                        {selectedEntry.admin_feedback && (
                                            <div style={{ fontSize: '13px', color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', lineHeight: '1.5' }}>
                                                <strong style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--warning)', marginBottom: 4, fontStyle: 'normal' }}>Admin Feedback:</strong>
                                                {selectedEntry.admin_feedback}
                                            </div>
                                        )}
                                    </div>
                                    <QAFeedbackTrail type="todo" itemId={selectedEntry.id} />
                                </div>

                                {/* Right Side: Action */}
                                <div className="action-panel" style={{ padding: '32px', background: 'var(--bg)' }}>
                                    <h4 className="modal-subtitle">Assessment</h4>
                                    <div className="form-group">
                                        <label className="form-label">QA Notes / Feedback</label>
                                        <textarea
                                            className="form-textarea"
                                            rows={12}
                                            value={qaReport.notes}
                                            onChange={e => setQaReport(p => ({ ...p, notes: e.target.value }))}
                                            placeholder={qaReport.status === 'verified' ? 'Optional: Testing notes...' : 'Required: Why did it fail?'}
                                            required={qaReport.status === 'failed'}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                                <button
                                    type="submit"
                                    className="btn"
                                    disabled={savingId === selectedEntry.id}
                                    style={{
                                        padding: '10px 24px',
                                        borderRadius: 8,
                                        fontWeight: 800,
                                        background: qaReport.status === 'verified' ? '#10b981' : '#ef4444',
                                        color: '#fff',
                                        border: 'none',
                                        fontSize: 13,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.02em'
                                    }}
                                >
                                    {savingId === selectedEntry.id ? 'Saving...' : `Confirm ${qaReport.status === 'verified' ? 'Pass' : 'Fail'}`}
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
                .modal-body.split-body, .split-body { display: grid; grid-template-columns: 1fr 1fr; gap: 0; padding: 0 !important; }
                .history-panel { padding: 32px; border-right: 1px solid var(--border); background: rgba(0,0,0,0.1); }
                .action-panel { padding: 32px; background: var(--bg); }
                
                .modal-subtitle { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--accent-light); margin-bottom: 24px; letter-spacing: 0.1em; border-left: 3px solid var(--accent); padding-left: 12px; }
                .emphasis-text { font-size: 18px !important; font-weight: 800 !important; color: var(--accent-light) !important; line-height: 1.4; }
                .data-item.full { grid-column: 1 / -1; margin-top: 12px; }
                .btn-icon { background: none; border: none; color: var(--text-dim); cursor: pointer; }
                .btn-icon:hover { color: var(--text); }
            `}</style>
        </div>
    )
}


