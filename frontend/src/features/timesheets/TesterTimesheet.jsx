import { useEffect, useState, useMemo } from 'react'
import {
    Plus, Trash2, Clock, Target, TrendingUp, History,
    Edit, ShieldCheck, AlertCircle, Users, X, RotateCcw, CheckCircle2
} from 'lucide-react'
import { useLocation } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import EditEntryModal from './EditEntryModal'
import QAFeedbackTrail from '../../components/common/QAFeedbackTrail'
import DataTable from '../../components/common/DataTable'
import { formatDate } from '../../utils/formatters'
import DateRangePicker from '../../components/DateRangePicker'

const STATUS_OPTS = ['todo', 'in_progress', 'done']
const STATUS_BADGE = {
    todo: 'badge-gray',
    in_progress: 'badge-yellow',
    done: 'badge-green',
    verified: 'badge-purple',
    failed: 'badge-red',
    blocked: 'badge-red',
}

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function TesterTimesheet() {
    const { user, hasRole } = useAuth()
    const location = useLocation()

    const [activeTab, setActiveTab] = useState('my_log')

    // ── Shared date range ──────────────────────────────────────────────────
    const [startDate, setStartDate] = useState(location.state?.startDate || todayISO())
    const [endDate, setEndDate] = useState(location.state?.endDate || todayISO())

    // ── My Log state (personal timesheet) ──────────────────────────────────
    const [myEntries, setMyEntries] = useState([])
    const [myProjects, setMyProjects] = useState([])
    const [myLoading, setMyLoading] = useState(true)
    const [savingMyId, setSavingMyId] = useState(null)
    const [filterProjectId, setFilterProjectId] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [editingEntry, setEditingEntry] = useState(null)

    const [newDate, setNewDate] = useState(todayISO())
    const [newProjectId, setNewProjectId] = useState('')
    const [newTitle, setNewTitle] = useState('')
    const [newTime, setNewTime] = useState('00:00')
    const [newNotes, setNewNotes] = useState('')
    const [newStatus, setNewStatus] = useState('in_progress')
    const [adding, setAdding] = useState(false)

    // ── Team Review state (admin-like view) ─────────────────────────────────
    const [teamEntries, setTeamEntries] = useState([])
    const [allUsers, setAllUsers] = useState([])
    const [allProjects, setAllProjects] = useState([])
    const [viewUserIds, setViewUserIds] = useState([])
    const [teamStatusFilter, setTeamStatusFilter] = useState('')
    const [qaFilter, setQaFilter] = useState('')
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [teamLoading, setTeamLoading] = useState(true)
    const [savingTeamId, setSavingTeamId] = useState(null)
    const [modal, setModal] = useState(null)
    const [selectedEntry, setSelectedEntry] = useState(null)
    const [qaReport, setQaReport] = useState({ status: '', notes: '' })

    // ── My Log: load ────────────────────────────────────────────────────────
    const loadMyLog = async () => {
        setMyLoading(true)
        try {
            const res = await api.get('/timesheets/my-history', { params: { startDate, endDate } })
            const timesheets = res.data.data
            const flat = timesheets.flatMap(ts =>
                (ts.entries || []).map(e => ({ ...e, date: ts.work_date, userId: ts.user_id }))
            )
            setMyEntries(flat.sort((a, b) => new Date(b.date) - new Date(a.date)))
        } catch (err) {
            toast.error(err.message)
        } finally {
            setMyLoading(false)
        }
    }

    const loadMyProjects = async () => {
        try {
            const res = await api.get('/projects', { params: { memberUserId: user?.id } })
            setMyProjects(res.data.data)
        } catch (_) { }
    }

    // ── Team Review: load ───────────────────────────────────────────────────
    const loadTeam = async () => {
        setTeamLoading(true)
        try {
            const params = {
                startDate,
                endDate,
                userIds: viewUserIds.length > 0 ? viewUserIds.join(',') : ''
            }
            const res = await api.get('/timesheets', { params })
            const flat = res.data.data.flatMap(ts =>
                (ts.entries || []).map(e => ({
                    ...e,
                    userName: ts.user?.full_name,
                    userId: ts.user_id,
                    date: ts.work_date,
                    submittedAt: ts.submitted_at
                }))
            )
            setTeamEntries(flat.sort((a, b) => new Date(b.date) - new Date(a.date)))
        } catch (err) {
            toast.error(err.message)
        } finally {
            setTeamLoading(false)
        }
    }

    const loadTeamUsers = async () => {
        try {
            const r = await api.get('/users')
            setAllUsers(r.data.data.sort((a, b) => a.full_name.localeCompare(b.full_name)))
        } catch (_) { }
    }

    const loadAllProjects = async () => {
        try {
            const r = await api.get('/projects')
            setAllProjects(r.data.data)
        } catch (_) { }
    }

    useEffect(() => {
        loadMyProjects()
        loadTeamUsers()
        loadAllProjects()
    }, [user?.id])

    useEffect(() => { loadMyLog() }, [startDate, endDate])
    useEffect(() => { loadTeam() }, [startDate, endDate, viewUserIds])

    // ── My Log: actions ─────────────────────────────────────────────────────
    const handleAddEntry = async (e) => {
        e.preventDefault()
        if (!newTitle.trim() || !newProjectId || !newNotes.trim() || !newTime || newTime === '00:00') {
            return toast.error('Please fill all fields: Project, Activity, Time, and Notes are required.')
        }
        setAdding(true)
        try {
            const tsRes = await api.get('/timesheets/me', { params: { date: newDate } })
            const tsId = tsRes.data.data.id
            await api.post(`/timesheets/${tsId}/entries`, {
                title: newTitle.trim(),
                status: newStatus,
                hours_spent: newTime,
                notes: newNotes,
                project_id: newProjectId || null
            })
            setNewTitle(''); setNewTime('00:00'); setNewNotes(''); setNewStatus('in_progress')
            toast.success('Activity logged!')
            loadMyLog()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setAdding(false)
        }
    }

    const handleMyUpdate = async (entryId, updates) => {
        setSavingMyId(entryId)
        try {
            const res = await api.patch(`/timesheets/entries/${entryId}`, updates)
            setMyEntries(prev => prev.map(e => e.id === entryId ? { ...e, ...res.data.data } : e))
            toast.success('Activity updated')
        } catch (err) { toast.error(err.message) }
        finally { setSavingMyId(null) }
    }

    // ── Team Review: actions ────────────────────────────────────────────────
    const handleTeamUpdate = async (entryId, updates) => {
        setSavingTeamId(entryId)
        try {
            await api.patch(`/timesheets/entries/${entryId}`, updates)
            setTeamEntries(prev => prev.map(e => e.id === entryId ? { ...e, ...updates } : e))
        } catch (err) { toast.error(err.message) }
        finally { setSavingTeamId(null) }
    }

    const openQaModal = (entry, status) => {
        setSelectedEntry(entry)
        setQaReport({ status, notes: entry.qa_notes || '' })
        setModal('qa_report')
    }

    const handleQaReport = async (e) => {
        e.preventDefault()
        if (!selectedEntry) return
        setSavingTeamId(selectedEntry.id)
        try {
            const updates = { status: qaReport.status, qa_notes: qaReport.notes }
            await api.patch(`/timesheets/entries/${selectedEntry.id}`, updates)
            await api.post(`/timesheets/entries/${selectedEntry.id}/feedback`, {
                content: qaReport.notes || (qaReport.status === 'verified' ? 'Verified by QA' : 'Failed QA'),
                new_status: qaReport.status
            })
            setTeamEntries(prev => prev.map(e => e.id === selectedEntry.id ? { ...e, ...updates } : e))
            toast.success(`Marked as ${qaReport.status}`)
            setModal(null)
        } catch (err) { toast.error(err.message) }
        finally { setSavingTeamId(null) }
    }

    const toggleUser = (uid) =>
        setViewUserIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid])

    // ── Computed ────────────────────────────────────────────────────────────
    const todayStats = useMemo(() => {
        const todayE = myEntries.filter(e => e.date === todayISO())
        const mins = todayE.reduce((a, e) => {
            const [h, m] = (e.hours_spent || '0:00').split(':').map(Number)
            return a + h * 60 + m
        }, 0)
        return { hours: (mins / 60).toFixed(1), count: todayE.length, done: todayE.filter(e => e.status === 'done').length }
    }, [myEntries])

    const filteredMyEntries = useMemo(() => {
        return myEntries.filter(e => {
            if (filterProjectId && e.project_id !== filterProjectId) return false
            if (statusFilter && e.status !== statusFilter) return false
            return true
        })
    }, [myEntries, filterProjectId, statusFilter])

    const filteredTeamEntries = useMemo(() => {
        let res = teamEntries
        if (selectedProjectId) res = res.filter(e => e.project_id === selectedProjectId)
        if (teamStatusFilter === 'pending_qa') res = res.filter(e => e.status === 'done')
        else if (teamStatusFilter === 'audited') res = res.filter(e => ['verified', 'failed'].includes(e.status))
        else if (teamStatusFilter) res = res.filter(e => e.status === teamStatusFilter)
        if (qaFilter === 'passed') res = res.filter(e => e.status === 'verified')
        else if (qaFilter === 'failed') res = res.filter(e => e.status === 'failed')
        else if (qaFilter === 'pending') res = res.filter(e => !['verified', 'failed'].includes(e.status))
        return res
    }, [teamEntries, selectedProjectId, teamStatusFilter, qaFilter])

    // ── Columns ─────────────────────────────────────────────────────────────
    const myColumns = useMemo(() => [
        { label: 'Date', key: 'date', width: '110px', render: (val) => formatDate(val) },
        { label: 'Project', key: 'project.name', width: '130px', render: (val) => <span className="badge badge-purple" style={{ fontSize: 9 }}>{(val || 'In-House').toUpperCase()}</span> },
        {
            label: 'Activity', key: 'title', wrap: true, copyable: true,
            render: (val, e) => (
                <div style={{ minWidth: 220 }}>
                    <div style={{ fontWeight: 600 }}>{val}</div>
                    {e.notes && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, fontStyle: 'italic' }}>{e.notes}</div>}
                </div>
            )
        },
        { label: 'Time', key: 'hours_spent', width: '80px', type: 'number', render: (val) => <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{val}</span> },
        {
            label: 'Status', key: 'status', width: '120px',
            render: (val, e) => {
                const locked = ['done', 'verified', 'failed'].includes(val) && val !== 'failed'
                if (locked) return <span className={`badge ${STATUS_BADGE[val]}`} style={{ width: '100%', display: 'block', textAlign: 'center' }}>{val.toUpperCase()}</span>
                return (
                    <select className={`form-select-badge ${STATUS_BADGE[val]}`} value={val}
                        onChange={ev => handleMyUpdate(e.id, { status: ev.target.value })}
                        onClick={ev => ev.stopPropagation()} style={{ textTransform: 'uppercase', fontSize: 10 }}>
                        {STATUS_OPTS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        {val === 'failed' && <option value="done">DONE (RESUBMIT)</option>}
                    </select>
                )
            }
        },
        {
            label: 'QA Result', key: 'status', width: '100px',
            render: (val) => {
                if (val === 'verified') return <span className="badge badge-green" style={{ width: '100%', textAlign: 'center', display: 'block' }}>PASS</span>
                if (val === 'failed') return <span className="badge badge-red" style={{ width: '100%', textAlign: 'center', display: 'block' }}>FAIL</span>
                if (['done'].includes(val)) return <span className="badge badge-yellow" style={{ width: '100%', textAlign: 'center', display: 'block' }}>UNDER REVIEW</span>
                return <span className="badge badge-gray" style={{ width: '100%', textAlign: 'center', display: 'block' }}>PENDING</span>
            }
        },
        {
            label: 'Actions', key: 'id', width: '80px', sticky: true,
            render: (_, e) => (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button className="btn btn-icon btn-sm" onClick={ev => { ev.stopPropagation(); setEditingEntry(e) }}><Edit size={14} /></button>
                </div>
            )
        }
    ], [])

    const teamColumns = useMemo(() => [
        {
            label: 'Date', key: 'date', width: '80px',
            render: (val) => (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{new Date(val).getDate()}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{new Date(val).toLocaleDateString('en-IN', { month: 'short' })}</div>
                </div>
            )
        },
        {
            label: 'Hours', key: 'hours_spent', width: '75px', type: 'number',
            render: (val) => (
                <div style={{ background: 'var(--accent-transparent)', padding: '4px 8px', borderRadius: 6, display: 'inline-block', minWidth: 40, textAlign: 'center' }}>
                    <span style={{ fontWeight: 800, color: 'var(--accent-light)', fontSize: 13 }}>{val}</span>
                    <span style={{ fontSize: 9, color: 'var(--accent-light)', opacity: 0.7, marginLeft: 1 }}>h</span>
                </div>
            )
        },
        { label: 'Employee', key: 'userName', width: '140px' },
        { label: 'Project', key: 'project.name', width: '110px', render: (val) => <span className="badge badge-purple" style={{ fontSize: 9 }}>{(val || 'In-House').toUpperCase()}</span> },
        {
            label: 'Activity', key: 'title', wrap: true, copyable: true,
            render: (val, e) => (
                <div style={{ minWidth: 230 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{val}</div>
                    {e.notes && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, fontStyle: 'italic' }}>{e.notes}</div>}
                    {e.developer_reply && <div style={{ fontSize: 10, color: 'var(--success)', marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><RotateCcw size={10} />{e.developer_reply}</div>}
                </div>
            )
        },
        { label: 'Status', key: 'status', width: '110px', render: (val) => <span className={`badge ${STATUS_BADGE[val] || ''}`} style={{ fontSize: 10 }}>{val?.toUpperCase()}</span> },
        {
            label: 'QA Verdict', key: 'status', width: '95px',
            render: (val) => {
                if (val === 'verified') return <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: 10 }}>✅ PASSED</span>
                if (val === 'failed') return <span style={{ color: 'var(--danger)', fontWeight: 800, fontSize: 10 }}>❌ FAILED</span>
                return <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>—</span>
            }
        },
        {
            label: 'Actions', key: 'id', width: '100px', sticky: true,
            render: (_, e) => (
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    {(e.status === 'done' || e.status === 'verified' || e.status === 'failed') && (
                        <>
                            <button className={`btn btn-icon btn-sm ${e.status === 'verified' ? 'btn-success' : 'btn-ghost'}`} onClick={() => openQaModal(e, 'verified')} title="Pass"><ShieldCheck size={14} /></button>
                            <button className={`btn btn-icon btn-sm ${e.status === 'failed' ? 'btn-danger' : 'btn-ghost'}`} onClick={() => openQaModal(e, 'failed')} title="Fail"><AlertCircle size={14} /></button>
                        </>
                    )}
                </div>
            )
        }
    ], [])

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={{ padding: 8 }}>
            <div className="page-header" style={{ marginBottom: 0 }}>
                <div>
                    <h1>Tester Workspace</h1>
                    <p>Log your daily activities and review developer submissions</p>
                </div>
                <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onRangeChange={range => { setStartDate(range.startDate); setEndDate(range.endDate) }}
                />
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', margin: '24px 0' }}>
                {[
                    { key: 'my_log', label: '📋 My Activity Log' },
                    { key: 'team_review', label: '🔍 Team Review' },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                        padding: '10px 24px', background: 'none', border: 'none',
                        borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                        color: activeTab === tab.key ? 'var(--accent-light)' : 'var(--text-muted)',
                        fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'color 0.15s'
                    }}>{tab.label}</button>
                ))}
            </div>

            {/* ── Tab 1: My Activity Log ── */}
            {activeTab === 'my_log' && (
                <>
                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
                        {[
                            { icon: <Clock size={20} />, val: `${todayStats.hours}h`, label: 'Logged Today', color: 'purple' },
                            { icon: <CheckCircle2 size={20} />, val: todayStats.count, label: "Today's Activities", color: 'yellow' },
                            { icon: <Target size={20} />, val: todayStats.done, label: 'Done Today', color: 'green' },
                        ].map(s => (
                            <div key={s.label} className="card shadow-sm stat-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}>
                                <div className={`stat-icon-circle ${s.color}`}>{s.icon}</div>
                                <div>
                                    <div className="stat-value">{s.val}</div>
                                    <div className="stat-label">{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
                        {/* Log Form */}
                        <div className="card polished-card" style={{ padding: 24 }}>
                            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <TrendingUp size={18} className="text-accent" />
                                <h3 style={{ margin: 0, fontSize: 16 }}>Log Activity</h3>
                            </div>
                            <form onSubmit={handleAddEntry} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input type="date" className="form-input" value={newDate} onChange={e => setNewDate(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Project</label>
                                    <select className="form-select" value={newProjectId} onChange={e => setNewProjectId(e.target.value)}>
                                        <option value="">Select Project...</option>
                                        {myProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Activity / Task</label>
                                    <input className="form-input" placeholder="e.g. Testing login flow" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Time (hh:mm)</label>
                                    <input type="time" className="form-input" value={newTime} onChange={e => setNewTime(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea className="form-input" placeholder="Brief details, findings, test results…" value={newNotes} onChange={e => setNewNotes(e.target.value)} rows={3} required />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}
                                    disabled={adding || !newTitle.trim() || !newProjectId || !newNotes.trim() || !newTime || newTime === '00:00'}>
                                    {adding ? <span className="spinner-sm" /> : <><Plus size={18} /> Log Activity</>}
                                </button>
                            </form>
                        </div>

                        {/* My Entries Table */}
                        <div className="card table-card" style={{ padding: 0 }}>
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <History size={18} className="text-accent" />
                                    <h3 style={{ margin: 0, fontSize: 16 }}>Activity History</h3>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <select className="form-select" style={{ width: 'auto', padding: '4px 12px', fontSize: 11 }} value={filterProjectId} onChange={e => setFilterProjectId(e.target.value)}>
                                        <option value="">ALL PROJECTS</option>
                                        {myProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <select className="form-select" style={{ width: 'auto', padding: '4px 12px', fontSize: 11 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                        <option value="">ALL STATUS</option>
                                        {['todo', 'in_progress', 'done', 'verified', 'failed'].map(s => (
                                            <option key={s} value={s}>{s.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <DataTable loading={myLoading} data={filteredMyEntries} columns={myColumns} fileName="my_tester_timesheet" />
                        </div>
                    </div>
                </>
            )}

            {/* ── Tab 2: Team Review ── */}
            {activeTab === 'team_review' && (
                <>
                    <div className="card polished-card filter-bar" style={{ marginBottom: 28, padding: 20 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 2fr) 1fr 1fr 1fr', gap: 20 }}>
                            <div>
                                <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Users size={12} /> DEVELOPERS ({viewUserIds.length || 'ALL'})
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                                    {allUsers.map(u => (
                                        <button key={u.id}
                                            onClick={() => toggleUser(u.id)}
                                            style={{
                                                padding: '6px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                                border: viewUserIds.includes(u.id) ? '1px solid var(--accent)' : '1px solid var(--border)',
                                                background: viewUserIds.includes(u.id) ? 'var(--accent)' : 'var(--bg-card)',
                                                color: viewUserIds.includes(u.id) ? 'white' : 'inherit'
                                            }}>{u.full_name}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Project</label>
                                <select className="form-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                                    <option value="">All Projects</option>
                                    {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Status</label>
                                <select className="form-select" value={teamStatusFilter} onChange={e => setTeamStatusFilter(e.target.value)}>
                                    <option value="">All Statuses</option>
                                    {['todo', 'in_progress', 'done', 'blocked', 'verified', 'failed'].map(s => (
                                        <option key={s} value={s}>{s.toUpperCase().replace('_', ' ')}</option>
                                    ))}
                                    <option disabled>──────</option>
                                    <option value="pending_qa">PENDING QA</option>
                                    <option value="audited">AUDITED</option>
                                </select>
                            </div>
                            <div>
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
                        <DataTable loading={teamLoading} data={filteredTeamEntries} columns={teamColumns} fileName={`team_review_${startDate}`} />
                    </div>
                </>
            )}

            {/* Edit Entry Modal (my log) */}
            {editingEntry && (
                <EditEntryModal
                    entry={editingEntry}
                    myProjects={myProjects}
                    onClose={() => setEditingEntry(null)}
                    onSaved={updated => setMyEntries(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e))}
                />
            )}

            {/* QA Report Modal */}
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
                                    <h4 className="modal-subtitle">Activity Details</h4>
                                    <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{selectedEntry.title}</p>
                                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-dim)' }}>
                                        <span><strong>By:</strong> {selectedEntry.userName}</span>
                                        <span><strong>Project:</strong> {selectedEntry.project?.name || 'In-House'}</span>
                                    </div>
                                    <div style={{ marginTop: 16 }}>
                                        <QAFeedbackTrail type="todo" itemId={selectedEntry.id} />
                                    </div>
                                </div>
                                <div style={{ padding: 32 }}>
                                    <h4 className="modal-subtitle">Assessment</h4>
                                    <div className="form-group">
                                        <label className="form-label">QA Notes / Feedback</label>
                                        <textarea
                                            className="form-control" rows={10}
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
                                <button type="submit" className={`btn ${qaReport.status === 'verified' ? 'btn-success' : 'btn-danger'}`}
                                    disabled={savingTeamId === selectedEntry.id}>
                                    {savingTeamId === selectedEntry.id ? 'Saving...' : `Confirm ${qaReport.status === 'verified' ? 'Pass' : 'Fail'}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .stat-value { font-size: 24px; font-weight: 800; }
                .stat-label { font-size: 11px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; }
                .stat-icon-circle { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .stat-icon-circle.purple { background: rgba(124,58,237,0.1); color: var(--accent); }
                .stat-icon-circle.yellow { background: rgba(245,158,11,0.1); color: var(--warning); }
                .stat-icon-circle.green { background: rgba(34,197,94,0.1); color: var(--success); }
                .modal-subtitle { font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--accent); margin-bottom: 20px; letter-spacing: 0.1em; }
                .form-select-badge { width: 100%; border: none; background: transparent; color: inherit; font-size: 10px; font-weight: 800; cursor: pointer; text-align: center; }
                .badge-purple { background: rgba(139,92,246,0.1); color: #8b5cf6; }
            `}</style>
        </div>
    )
}
