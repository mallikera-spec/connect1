import { useEffect, useState, useMemo } from 'react'
import { Link2, Clock, Calendar, Users, Filter, ShieldCheck, AlertCircle, X, Trash2, RotateCcw } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import QAFeedbackTrail from '../../components/common/QAFeedbackTrail'
import DataTable from '../../components/common/DataTable'
import { formatDate } from '../../utils/formatters'
import DateRangePicker from '../../components/DateRangePicker'

const STATUS_BADGE = {
    todo: 'badge-blue',
    in_progress: 'badge-yellow',
    done: 'badge-green',
    blocked: 'badge-red',
    verified: 'badge-purple',
    failed: 'badge-red'
}

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function AdminTimesheet() {
    const { hasRole, user } = useAuth()
    const location = useLocation()

    const [startDate, setStartDate] = useState(location.state?.startDate || todayISO())
    const [endDate, setEndDate] = useState(location.state?.endDate || todayISO())
    const [viewUserIds, setViewUserIds] = useState(
        location.state?.viewUserId ? [location.state.viewUserId] : []
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

    const toggleUser = (uid) => {
        setViewUserIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid])
    }

    const filtered = useMemo(() => {
        let res = allEntries;
        if (selectedProjectId) {
            res = res.filter(e => e.project_id === selectedProjectId || e.task?.project_id === selectedProjectId);
        }
        if (statusFilter) {
            if (statusFilter === 'completed') {
                res = res.filter(e => ['done', 'verified', 'failed'].includes(e.status));
            } else if (statusFilter === 'audited') {
                res = res.filter(e => ['verified', 'failed'].includes(e.status));
            } else if (statusFilter === 'pending_qa') {
                res = res.filter(e => e.status === 'done');
            } else {
                res = res.filter(e => e.status === statusFilter);
            }
        }
        if (qaFilter) {
            if (qaFilter === 'passed') res = res.filter(e => e.status === 'verified');
            else if (qaFilter === 'failed') res = res.filter(e => e.status === 'failed');
            else if (qaFilter === 'pending') res = res.filter(e => !['verified', 'failed'].includes(e.status));
        }
        return res;
    }, [allEntries, selectedProjectId, statusFilter, qaFilter]);

    const columns = useMemo(() => [
        {
            label: 'Date',
            key: 'date',
            width: '80px',
            render: (val) => (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{new Date(val).getDate()}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{new Date(val).toLocaleDateString('en-IN', { month: 'short' })}</div>
                </div>
            )
        },
        {
            label: 'Hours',
            key: 'hours_spent',
            width: '80px',
            type: 'number',
            render: (val) => (
                <div style={{ background: 'var(--accent-transparent)', padding: '4px 8px', borderRadius: 6, display: 'inline-block', minWidth: 45, textAlign: 'center' }}>
                    <span style={{ fontWeight: 800, color: 'var(--accent-light)', fontSize: 13 }}>{val}</span>
                    <span style={{ fontSize: 9, color: 'var(--accent-light)', opacity: 0.7, marginLeft: 1 }}>h</span>
                </div>
            )
        },
        {
            label: 'Employee',
            key: 'userName',
            width: '150px'
        },
        {
            label: 'Project',
            key: 'project.name',
            width: '120px',
            render: (val) => <span className="badge badge-purple" style={{ fontSize: 9 }}>{(val || 'In-House').toUpperCase()}</span>
        },
        {
            label: 'Activity',
            key: 'title',
            wrap: true,
            copyable: true,
            render: (val, e) => (
                <div style={{ minWidth: 250 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{val}</div>
                    {e.notes && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, fontStyle: 'italic' }}>{e.notes}</div>}
                    {e.developer_reply && <div style={{ fontSize: 10, color: 'var(--success)', marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><RotateCcw size={10} /> {e.developer_reply}</div>}
                </div>
            )
        },
        {
            label: 'Status',
            key: 'status',
            width: '120px',
            render: (val) => <span className={`badge ${STATUS_BADGE[val] || ''}`} style={{ fontSize: 10 }}>{val?.toUpperCase()}</span>
        },
        {
            label: 'QA Verdict',
            key: 'status',
            width: '100px',
            render: (val) => {
                if (val === 'verified') return <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: 10 }}>✅ PASSED</span>;
                if (val === 'failed') return <span style={{ color: 'var(--danger)', fontWeight: 800, fontSize: 10 }}>❌ FAILED</span>;
                return <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>—</span>;
            }
        },
        {
            label: 'Feedback',
            key: 'admin_feedback',
            width: '180px',
            render: (val, e) => (
                <input
                    className="form-input"
                    placeholder="Add feedback…"
                    defaultValue={val || ''}
                    onBlur={ev => handleUpdate(e.id, { admin_feedback: ev.target.value })}
                    style={{ height: '32px', fontSize: 11 }}
                />
            )
        },
        {
            label: 'Actions',
            key: 'id',
            width: '120px',
            sticky: true,
            render: (_, e) => (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    {(hasRole('Tester') || hasRole('super_admin') || hasRole('director') || hasRole('Director')) && (e.status === 'done' || e.status === 'verified' || e.status === 'failed') && (
                        <>
                            <button className={`btn btn-icon btn-sm ${e.status === 'verified' ? 'btn-success' : 'btn-ghost'}`} onClick={() => openQaModal(e, 'verified')} title="Approve"><ShieldCheck size={14} /></button>
                            <button className={`btn btn-icon btn-sm ${e.status === 'failed' ? 'btn-danger' : 'btn-ghost'}`} onClick={() => openQaModal(e, 'failed')} title="Reject"><AlertCircle size={14} /></button>
                        </>
                    )}
                    {(hasRole('super_admin') || hasRole('director') || hasRole('Director')) && (
                        <button className="btn btn-icon btn-sm btn-danger-ghost" onClick={() => handleDeleteEntry(e.id)} title="Delete Entry"><Trash2 size={14} /></button>
                    )}
                </div>
            )
        }
    ], [hasRole]);

    return (
        <div className="admin-timesheet">
            <div className="page-header">
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

            <div className="card polished-card filter-bar" style={{ marginBottom: 32, padding: 20 }}>
                <div className="filters-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) 1fr 1fr 1fr', gap: 24 }}>
                    <div className="filter-group">
                        <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 12 }}>
                            <Users size={12} style={{ marginRight: 6 }} /> EMPLOYEES ({viewUserIds.length || 'ALL'})
                        </label>
                        <div className="employee-chips">
                            {allUsers.map(u => (
                                <button
                                    key={u.id}
                                    className={`chip ${viewUserIds.includes(u.id) ? 'active' : ''}`}
                                    onClick={() => toggleUser(u.id)}
                                >
                                    {u.full_name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <label className="form-label">Project</label>
                        <select className="form-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                            <option value="">All Projects</option>
                            {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">All Statuses</option>
                            {['todo', 'in_progress', 'done', 'blocked', 'verified', 'failed'].map(s => (
                                <option key={s} value={s}>{s.toUpperCase().replace('_', ' ')}</option>
                            ))}
                            <option disabled>──────</option>
                            <option value="completed">COMPLETED</option>
                            <option value="audited">AUDITED</option>
                            <option value="pending_qa">PENDING QA</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="form-label">QA Filter</label>
                        <select className="form-select" value={qaFilter} onChange={e => setQaFilter(e.target.value)}>
                            <option value="">All QA Results</option>
                            <option value="passed">✅ PASSED</option>
                            <option value="failed">❌ FAILED</option>
                            <option value="pending">⏳ PENDING</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card table-card">
                <DataTable
                    loading={loading}
                    data={filtered}
                    columns={columns}
                    fileName={`team_timesheet_${startDate}`}
                />
            </div>

            {modal === 'qa_report' && selectedEntry && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
                    <div className="modal modal-lg" style={{ maxWidth: 900 }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Verification Report: {qaReport.status === 'verified' ? 'Pass' : 'Fail'}</h2>
                            <button className="btn-icon" onClick={() => setModal(null)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleQaReport}>
                            <div className="modal-body split-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 0 }}>
                                <div style={{ padding: 32, background: 'rgba(0,0,0,0.05)', borderRight: '1px solid var(--border)' }}>
                                    <h4 className="modal-subtitle">Details</h4>
                                    <div style={{ marginBottom: 24 }}>
                                        <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{selectedEntry.title}</p>
                                        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-dim)' }}>
                                            <span><strong>Dev:</strong> {selectedEntry.userName}</span>
                                            <span><strong>Project:</strong> {selectedEntry.project?.name || 'In-House'}</span>
                                        </div>
                                    </div>
                                    <QAFeedbackTrail type="todo" itemId={selectedEntry.id} />
                                </div>
                                <div style={{ padding: 32 }}>
                                    <h4 className="modal-subtitle">Assessment</h4>
                                    <div className="form-group">
                                        <label className="form-label">QA Notes / Feedback</label>
                                        <textarea
                                            className="form-control"
                                            rows={10}
                                            value={qaReport.notes}
                                            onChange={e => setQaReport(p => ({ ...p, notes: e.target.value }))}
                                            placeholder={qaReport.status === 'verified' ? 'Optional notes...' : 'Required: Why did it fail?'}
                                            required={qaReport.status === 'failed'}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                                <button
                                    type="submit"
                                    className={`btn ${qaReport.status === 'verified' ? 'btn-success' : 'btn-danger'}`}
                                    disabled={savingId === selectedEntry.id}
                                >
                                    {savingId === selectedEntry.id ? 'Saving...' : `Confirm ${qaReport.status === 'verified' ? 'Pass' : 'Fail'}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .admin-timesheet { padding: 8px; }
                .employee-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
                .chip { 
                    padding: 6px 12px; border-radius: 100px; border: 1px solid var(--border); 
                    background: var(--bg-card); font-size: 11px; font-weight: 600; cursor: pointer;
                    transition: all 0.2s;
                }
                .chip:hover { border-color: var(--accent); }
                .chip.active { background: var(--accent); color: white; border-color: var(--accent); }
                .badge-purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
                .modal-subtitle { font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--accent); margin-bottom: 20px; letter-spacing: 0.1em; }
                .btn-danger-ghost:hover { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
            `}</style>
        </div>
    )
}
