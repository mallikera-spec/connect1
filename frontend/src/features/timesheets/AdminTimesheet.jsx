import { useEffect, useState } from 'react'
import { Link2, Clock, Calendar, Users, Filter, ShieldCheck, AlertCircle, X, Trash2, RotateCcw } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import QAFeedbackTrail from '../../components/common/QAFeedbackTrail'
import DataTable from '../../components/common/DataTable'

const STATUS_BADGE = {
    todo: 'badge-blue',
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
            <div className="card polished-card shadow-lg" style={{ marginBottom: 32, padding: '24px' }}>
                <div className="filters-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '24px', alignItems: 'flex-start' }}>
                    <div className="filter-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>
                            <Users size={14} /> EMPLOYEE SELECTION ({viewUserIds.length || 'ALL'})
                        </label>
                        <div className="employee-chips-container">
                            {allUsers.map(u => (
                                <button
                                    key={u.id}
                                    className={`employee-chip ${viewUserIds.includes(u.id) ? 'active' : ''}`}
                                    onClick={() => toggleUser(u.id)}
                                >
                                    {u.full_name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>
                            <Filter size={14} /> Project
                        </label>
                        <select className="form-select premium-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                            <option value="">All Projects</option>
                            {allProjects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>
                            <Clock size={14} /> Status
                        </label>
                        <select className="form-select premium-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">All Statuses</option>
                            {['todo', 'in_progress', 'done', 'blocked', 'verified', 'failed'].map(s => (
                                <option key={s} value={s}>{s.toUpperCase().replace('_', ' ')}</option>
                            ))}
                            <option disabled>──────</option>
                            <option value="completed">COMPLETED (All QA)</option>
                            <option value="audited">AUDITED (Pass/Fail)</option>
                            <option value="pending_qa">PENDING QA</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>
                            <ShieldCheck size={14} /> QA Filter
                        </label>
                        <select className="form-select premium-select" value={qaFilter} onChange={e => setQaFilter(e.target.value)}>
                            <option value="">All QA Results</option>
                            <option value="passed">✅ PASSED</option>
                            <option value="failed">❌ FAILED</option>
                            <option value="pending">⏳ PENDING</option>
                        </select>
                    </div>
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
                        if (statusFilter === 'completed') {
                            filtered = filtered.filter(e => ['done', 'verified', 'failed'].includes(e.status));
                        } else if (statusFilter === 'audited') {
                            filtered = filtered.filter(e => ['verified', 'failed'].includes(e.status));
                        } else if (statusFilter === 'pending_qa') {
                            filtered = filtered.filter(e => e.status === 'done');
                        } else {
                            filtered = filtered.filter(e => e.status === statusFilter);
                        }
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
                                    width: '70px',
                                    render: (val) => (
                                        <div style={{ minWidth: 50 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{new Date(val).getDate()}</div>
                                            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{new Date(val).toLocaleDateString('en-IN', { month: 'short' })}</div>
                                        </div>
                                    ),
                                    exportValue: (val) => val
                                },
                                {
                                    label: 'Hrs',
                                    key: 'hours_spent',
                                    width: '60px',
                                    render: (val) => (
                                        <div style={{ background: 'var(--accent-transparent)', padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>
                                            <span style={{ fontWeight: 800, color: 'var(--accent-light)', fontSize: 13 }}>{val}</span>
                                            <span style={{ fontSize: 9, color: 'var(--accent-light)', opacity: 0.7, marginLeft: 1 }}>h</span>
                                        </div>
                                    )
                                },
                                {
                                    label: 'Employee',
                                    key: 'userName',
                                    width: '120px',
                                    render: (val) => <span style={{ fontSize: 12, fontWeight: 600 }}>{val}</span>
                                },
                                {
                                    label: 'Project',
                                    key: 'project.name',
                                    width: '100px',
                                    render: (val) => <span style={{ fontSize: 9, padding: '3px 8px', fontWeight: 800, background: 'var(--bg-header)', color: 'var(--accent-light)', borderRadius: 20, border: '1px solid var(--accent-transparent)' }}>{(val || 'In-House').toUpperCase()}</span>
                                },
                                {
                                    label: 'Task Details',
                                    key: 'title',
                                    wrap: true,
                                    render: (val, e) => (
                                        <div style={{ minWidth: 250, whiteSpace: 'normal' }}>
                                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{val}</div>
                                            {e.notes && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, fontStyle: 'italic' }}>{e.notes}</div>}
                                            {e.developer_reply && <div style={{ fontSize: 10, color: '#10b981', marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><RotateCcw size={10} /> {e.developer_reply}</div>}
                                        </div>
                                    )
                                },
                                {
                                    label: 'Submitted',
                                    key: 'created_at',
                                    width: '80px',
                                    render: (val) => <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>{val ? new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                                },
                                {
                                    label: 'Status',
                                    key: 'status',
                                    width: '90px',
                                    render: (val) => <span className={`badge-pill ${STATUS_BADGE[val]}`} style={{ fontSize: 10, padding: '3px 10px', fontWeight: 800, borderRadius: 6 }}>{val?.toUpperCase()}</span>
                                },
                                {
                                    label: 'Verdict',
                                    key: 'status',
                                    width: '80px',
                                    render: (val) => {
                                        if (val === 'verified') return <div style={{ color: '#10b981', fontWeight: 900, fontSize: 10, textAlign: 'center' }}>✅ PASSED</div>;
                                        if (val === 'failed') return <div style={{ color: '#ef4444', fontWeight: 900, fontSize: 10, textAlign: 'center' }}>❌ FAILED</div>;
                                        return <div style={{ color: 'var(--text-dim)', fontSize: 10, textAlign: 'center' }}>—</div>;
                                    }
                                },
                                {
                                    label: 'QA Notes',
                                    key: 'qa_notes',
                                    width: '100px',
                                    wrap: true,
                                    render: (val, e) => (
                                        <div style={{ fontSize: 10, color: e.status === 'verified' ? 'var(--text-muted)' : '#f87171', fontWeight: 600, background: 'rgba(0,0,0,0.1)', padding: '3px 6px', borderRadius: 4 }}>
                                            {val || <span style={{ opacity: 0.3 }}>—</span>}
                                        </div>
                                    )
                                },
                                {
                                    label: 'Feedback',
                                    key: 'admin_feedback',
                                    width: '130px',
                                    render: (val, e) => (
                                        <input
                                            className="premium-input-sm"
                                            placeholder="Feedback…"
                                            defaultValue={val || ''}
                                            onBlur={ev => handleUpdate(e.id, { admin_feedback: ev.target.value })}
                                            style={{ height: '28px' }}
                                        />
                                    )
                                },
                                {
                                    label: 'Actions',
                                    key: 'id',
                                    width: '80px',
                                    render: (_, e) => (
                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                            {(hasRole('Tester') || hasRole('super_admin') || hasRole('director') || hasRole('Director')) && (e.status === 'done' || e.status === 'verified' || e.status === 'failed') && (
                                                <>
                                                    <button className={`btn-action pass ${e.status === 'verified' ? 'active' : ''}`} style={{ padding: 6 }} onClick={() => openQaModal(e, 'verified')}><ShieldCheck size={14} /></button>
                                                    <button className={`btn-action fail ${e.status === 'failed' ? 'active' : ''}`} style={{ padding: 6 }} onClick={() => openQaModal(e, 'failed')}><AlertCircle size={14} /></button>
                                                </>
                                            )}
                                            {(hasRole('super_admin') || hasRole('director') || hasRole('Director')) && (
                                                <button className="btn-action fail" style={{ padding: 6 }} onClick={() => handleDeleteEntry(e.id)} title="Delete Entry"><Trash2 size={14} /></button>
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
                .employee-chips-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    max-height: 150px;
                    overflow-y: auto;
                    padding: 4px;
                }
                .employee-chip {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    color: var(--text-muted);
                    padding: 6px 16px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .employee-chip:hover {
                    border-color: var(--accent);
                    background: var(--accent-transparent);
                    color: var(--text);
                }
                .employee-chip.active {
                    background: var(--accent);
                    border-color: var(--accent);
                    color: white;
                    box-shadow: 0 4px 12px var(--accent-transparent);
                }

                .premium-select {
                    background: var(--bg-input);
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    padding: 8px 12px;
                    font-weight: 600;
                    color: var(--text);
                    transition: all 0.2s;
                    cursor: pointer;
                }
                .premium-select:hover { border-color: var(--accent); }

                .premium-input-sm {
                    width: 100%;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    padding: 6px 10px;
                    font-size: 11px;
                    color: var(--text);
                    outline: none;
                    transition: all 0.2s;
                }
                .premium-input-sm:focus { border-color: var(--accent); background: rgba(255,255,255,0.05); }

                .btn-action {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--border);
                    color: var(--text-dim);
                    padding: 8px;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .btn-action:hover { background: rgba(255, 255, 255, 0.08); color: var(--text); }
                .btn-action.pass.active { background: #10b98120; color: #10b981; border-color: #10b981; }
                .btn-action.fail.active { background: #ef444420; color: #ef4444; border-color: #ef4444; }

                .badge-pill {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    white-space: nowrap;
                    border-radius: 100px;
                }

                .spinner-sm { width: 12px; height: 12px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

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


