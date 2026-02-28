import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, ListTodo, Users, CheckSquare, BookOpen, FileText, Flag,
    Plus, Trash2, Check, Clock, AlertCircle, CheckCircle2, Save, Pencil, X, UserPlus, UserMinus, Calendar
} from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const STATUS_BADGE = { pending: 'badge-gray', in_progress: 'badge-yellow', done: 'badge-green' }
const PRIORITY_BADGE = { low: 'badge-blue', medium: 'badge-yellow', high: 'badge-red' }
const MS_STATUS = { pending: { label: 'Pending', color: '#6b7280' }, in_progress: { label: 'In Progress', color: '#f59e0b' }, completed: { label: 'Completed', color: '#10b981' } }
const COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2']

function Avatar({ name, i, size = 36 }) {
    const c = COLORS[i % COLORS.length]
    return (
        <div style={{ width: size, height: size, borderRadius: '50%', background: c + '22', border: `2px solid ${c}`, color: c, fontWeight: 700, fontSize: size * 0.35, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {name?.[0]?.toUpperCase() || '?'}
        </div>
    )
}

function TabBtn({ id, active, onClick, icon: Icon, label, count }) {
    return (
        <button onClick={() => onClick(id)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: active ? 700 : 500, fontSize: 13, background: active ? 'var(--accent)' : 'transparent', color: active ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            <Icon size={15} />
            {label}
            {count !== undefined && (
                <span style={{ background: active ? 'rgba(255,255,255,0.3)' : 'var(--border)', borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                    {count}
                </span>
            )}
        </button>
    )
}

function Section({ title, action, children }) {
    return (
        <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h3>
                {action}
            </div>
            <div style={{ padding: 20 }}>{children}</div>
        </div>
    )
}

export default function ProjectDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { hasPermission } = useAuth()
    const canManage = hasPermission('manage_projects')

    const [tab, setTab] = useState('overview')
    const [project, setProject] = useState(null)
    const [tasks, setTasks] = useState([])
    const [notes, setNotes] = useState([])
    const [todos, setTodos] = useState([])
    const [brd, setBrd] = useState(null)
    const [milestones, setMilestones] = useState([])
    const [members, setMembers] = useState([])
    const [allUsers, setAllUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Forms
    const [newNote, setNewNote] = useState('')
    const [newTodo, setNewTodo] = useState('')
    const [brdContent, setBrdContent] = useState('')
    const [brdEditing, setBrdEditing] = useState(false)
    const [newMember, setNewMember] = useState({ userId: '', role: 'member' })
    const [newMs, setNewMs] = useState({ title: '', description: '', due_date: '', status: 'pending' })
    const [showMsForm, setShowMsForm] = useState(false)
    const [editingMs, setEditingMs] = useState(null)

    const load = async () => {
        setLoading(true)
        try {
            const [pRes, tRes, nRes, msRes, memRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get('/tasks', { params: { project_id: id } }),
                api.get(`/project-notes/project/${id}`).catch(() => ({ data: { data: [] } })),
                api.get(`/milestones/project/${id}`).catch(() => ({ data: { data: [] } })),
                api.get(`/projects/${id}/members`).catch(() => ({ data: { data: [] } })),
            ])
            setProject(pRes.data.data)
            setTasks(tRes.data.data || [])
            const allNotes = nRes.data.data || []
            // Resilient filtering — if type column has no data yet, treat all non-brd notes as meeting notes
            const hasTypes = allNotes.some(n => n.type && n.type !== 'meeting')
            if (hasTypes) {
                setTodos(allNotes.filter(n => n.type === 'todo'))
                setNotes(allNotes.filter(n => n.type === 'meeting'))
            } else {
                setTodos([])
                setNotes(allNotes.filter(n => n.type !== 'brd'))
            }
            const brdNote = allNotes.find(n => n.type === 'brd')
            setBrd(brdNote || null)
            setBrdContent(brdNote?.content || '')
            setMilestones(msRes.data.data || [])
            setMembers(memRes.data.data || [])

            if (canManage) {
                const uRes = await api.get('/users').catch(() => ({ data: { data: [] } }))
                setAllUsers(uRes.data.data || [])
            }
        } catch (err) {
            toast.error('Failed to load project')
            navigate('/projects')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [id])

    // Allow any user to add todos (not just canManage) — developers need this
    const canAddTodo = canManage || hasPermission('view_project_notes')

    const addNote = async (type, content) => {
        if (!content.trim()) return
        setSaving(true)
        try {
            await api.post(`/project-notes/project/${id}`, { type, content: content.trim(), title: type === 'meeting' ? `Meeting — ${new Date().toLocaleDateString('en-IN')}` : '' })
            toast.success('Saved')
            setNewNote(''); setNewTodo('')
            load()
        } catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const deleteNote = async (noteId) => {
        try { await api.delete(`/project-notes/${noteId}`); load() }
        catch (err) { toast.error(err.message) }
    }

    const saveBrd = async () => {
        setSaving(true)
        try {
            if (brd) await api.patch(`/project-notes/${brd.id}`, { content: brdContent })
            else await api.post(`/project-notes/project/${id}`, { type: 'brd', content: brdContent, title: 'BRD' })
            toast.success('BRD saved'); setBrdEditing(false); load()
        } catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const toggleTodo = async (todo) => {
        try { await api.patch(`/project-notes/${todo.id}`, { content: todo.content, meta: { done: !todo.meta?.done } }); load() }
        catch (err) { toast.error(err.message) }
    }

    const addMember = async (e) => {
        e.preventDefault()
        if (!newMember.userId) return
        try {
            await api.post(`/projects/${id}/members`, { user_id: newMember.userId, role: newMember.role })
            toast.success('Member added'); setNewMember({ userId: '', role: 'member' }); load()
        } catch (err) { toast.error(err.message) }
    }

    const removeMember = async (userId) => {
        try { await api.delete(`/projects/${id}/members/${userId}`); toast.success('Member removed'); load() }
        catch (err) { toast.error(err.message) }
    }

    const saveMilestone = async (e) => {
        e.preventDefault(); setSaving(true)
        try {
            if (editingMs) {
                await api.patch(`/milestones/${editingMs.id}`, newMs)
                setEditingMs(null)
            } else {
                await api.post(`/milestones/project/${id}`, newMs)
            }
            toast.success(editingMs ? 'Milestone updated' : 'Milestone added')
            setNewMs({ title: '', description: '', due_date: '', status: 'pending' })
            setShowMsForm(false); load()
        } catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const deleteMilestone = async (msId) => {
        try { await api.delete(`/milestones/${msId}`); toast.success('Milestone deleted'); load() }
        catch (err) { toast.error(err.message) }
    }

    const updateMsStatus = async (ms, status) => {
        try { await api.patch(`/milestones/${ms.id}`, { status }); load() }
        catch (err) { toast.error(err.message) }
    }

    if (loading) return <div className="page-loader"><div className="spinner" /></div>
    if (!project) return null

    const today = new Date()
    const tasksDone = tasks.filter(t => t.status === 'done').length
    const tasksIP = tasks.filter(t => t.status === 'in_progress').length
    const tasksP = tasks.filter(t => t.status === 'pending').length
    const overdue = tasks.filter(t => t.end_time && new Date(t.end_time) < today && t.status !== 'done')
    const msDone = milestones.filter(m => m.status === 'completed').length
    const msOverdue = milestones.filter(m => m.due_date && new Date(m.due_date) < today && m.status !== 'completed')
    const assignedIds = members.map(m => m.user?.id)
    const availableUsers = allUsers.filter(u => !assignedIds.includes(u.id))

    return (
        <div style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/projects')}><ArrowLeft size={18} /></button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{project.name}</h1>
                    {project.description && <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{project.description}</p>}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>by <strong>{project.creator?.full_name || '—'}</strong></span>
            </div>

            {/* Stats Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                    { label: 'Tasks', value: tasks.length, color: '#7c3aed', icon: ListTodo },
                    { label: 'Done', value: tasksDone, color: '#059669', icon: CheckCircle2 },
                    { label: 'In Progress', value: tasksIP, color: '#d97706', icon: Clock },
                    { label: 'Pending', value: tasksP, color: '#6b7280', icon: AlertCircle },
                    { label: 'Overdue', value: overdue.length, color: overdue.length > 0 ? '#dc2626' : '#6b7280', icon: AlertCircle },
                    { label: 'Milestones', value: `${msDone}/${milestones.length}`, color: '#0891b2', icon: Flag },
                ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ background: color + '18', color, padding: 7, borderRadius: 8 }}><Icon size={16} /></div>
                        <div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Progress bar */}
            {tasks.length > 0 && (
                <div className="card" style={{ padding: '12px 20px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span style={{ fontWeight: 600 }}>Task Progress</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{Math.round((tasksDone / tasks.length) * 100)}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${(tasksDone / tasks.length) * 100}%`, background: '#10b981', transition: 'width 0.5s' }} />
                        <div style={{ width: `${(tasksIP / tasks.length) * 100}%`, background: '#f59e0b', transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>✅ {tasksDone} done</span>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>🔄 {tasksIP} in progress</span>
                        <span>⏳ {tasksP} pending</span>
                        {overdue.length > 0 && <span style={{ color: '#dc2626', fontWeight: 700 }}>🔴 {overdue.length} overdue</span>}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: '5px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)', overflowX: 'auto', width: '100%' }}>
                {[
                    { id: 'overview', icon: ListTodo, label: 'Tasks', count: tasks.length },
                    { id: 'team', icon: Users, label: 'Team', count: members.length },
                    { id: 'todo', icon: CheckSquare, label: 'To-Do', count: todos.length },
                    { id: 'notes', icon: BookOpen, label: 'Meeting Notes', count: notes.length },
                    { id: 'brd', icon: FileText, label: 'BRD' },
                ].map(t => <TabBtn key={t.id} {...t} active={tab === t.id} onClick={setTab} />)}
            </div>

            {/* Two-column layout: main content + always-visible milestones panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

            {/* LEFT: main tab content */}
            <div>

            {/* ── TASKS ───────────────── */}
            {tab === 'overview' && (
                <Section title="All Tasks" action={canManage && <button className="btn btn-primary btn-sm" onClick={() => navigate('/tasks', { state: { openCreateModal: true, project_id: id } })}><Plus size={13} /> Add Task</button>}>
                    {tasks.length === 0 ? <div className="empty-state"><p>No tasks yet</p></div> : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        {['Task', 'Assignee', 'Status', 'Priority', 'Due Date', 'Hours'].map(h => (
                                            <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map(t => {
                                        const isOverdue = t.end_time && new Date(t.end_time) < today && t.status !== 'done'
                                        return (
                                            <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '9px 14px', fontWeight: 600, fontSize: 13 }}>
                                                    {t.title}
                                                    {t.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t.description.slice(0, 70)}{t.description.length > 70 ? '…' : ''}</div>}
                                                </td>
                                                <td style={{ padding: '9px 14px' }}>
                                                    {t.assignee ? <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Avatar name={t.assignee.full_name} i={0} size={26} /><span style={{ fontSize: 12 }}>{t.assignee.full_name}</span></div> : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>}
                                                </td>
                                                <td style={{ padding: '9px 14px' }}><span className={`badge ${STATUS_BADGE[t.status] || 'badge-gray'}`}>{t.status?.replace('_', ' ')}</span></td>
                                                <td style={{ padding: '9px 14px' }}><span className={`badge ${PRIORITY_BADGE[t.priority] || 'badge-gray'}`}>{t.priority}</span></td>
                                                <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: isOverdue ? 700 : 400, color: isOverdue ? '#dc2626' : 'var(--text-muted)' }}>
                                                    {t.end_time ? <>{isOverdue && '🔴 '}{new Date(t.end_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</> : '—'}
                                                </td>
                                                <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{t.estimated_hours || '—'} / {t.actual_hours?.toFixed(1) || '—'}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Section>
            )}

            {tab === 'milestones' && null /* milestones always in right panel */}

            {/* ── TEAM ────────────────── */}
            {tab === 'team' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {canManage && (
                        <div className="card" style={{ padding: 18 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Add Team Member</p>
                            <form onSubmit={addMember} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <select className="form-select" style={{ flex: '2 1 200px' }} value={newMember.userId} onChange={e => setNewMember(p => ({ ...p, userId: e.target.value }))}>
                                    <option value="">Select employee…</option>
                                    {availableUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
                                </select>
                                <select className="form-select" style={{ flex: '1 1 120px' }} value={newMember.role} onChange={e => setNewMember(p => ({ ...p, role: e.target.value }))}>
                                    <option value="member">Member</option>
                                    <option value="manager">Manager</option>
                                </select>
                                <button type="submit" className="btn btn-primary" disabled={!newMember.userId}><UserPlus size={14} /> Add</button>
                            </form>
                        </div>
                    )}

                    {members.length === 0 ? (
                        <div className="card"><div className="empty-state"><p>No team members assigned yet</p></div></div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                            {members.map((m, i) => {
                                const memberTasks = tasks.filter(t => t.assignee?.id === m.user?.id)
                                const done = memberTasks.filter(t => t.status === 'done').length
                                return (
                                    <div key={m.id} className="card" style={{ padding: 18 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                            <Avatar name={m.user?.full_name} i={i} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.user?.full_name || '—'}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.user?.email}</div>
                                                <span style={{ fontSize: 10, fontWeight: 700, background: m.role === 'manager' ? 'rgba(124,58,237,0.15)' : 'var(--border)', color: m.role === 'manager' ? 'var(--accent)' : 'var(--text-muted)', padding: '2px 7px', borderRadius: 99, marginTop: 3, display: 'inline-block' }}>{m.role}</span>
                                            </div>
                                            {canManage && (
                                                <button className="btn btn-danger btn-sm btn-icon" onClick={() => removeMember(m.user?.id)} title="Remove"><UserMinus size={13} /></button>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {[{ v: memberTasks.length, l: 'Tasks', c: 'var(--accent)' }, { v: done, l: 'Done', c: '#059669' }, { v: memberTasks.length - done, l: 'Open', c: '#d97706' }].map(({ v, l, c }) => (
                                                <div key={l} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: 8, textAlign: 'center' }}>
                                                    <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l}</div>
                                                </div>
                                            ))}
                                        </div>
                                        {memberTasks.length > 0 && (
                                            <div style={{ height: 3, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', marginTop: 10 }}>
                                                <div style={{ height: '100%', borderRadius: 99, background: '#059669', width: `${(done / memberTasks.length) * 100}%` }} />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── TO-DO ───────────────── */}
            {tab === 'todo' && (
                <Section title="Project To-Do List">
                    {canAddTodo && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <input className="form-input" placeholder="Add a to-do item…" value={newTodo} onChange={e => setNewTodo(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote('todo', newTodo)} style={{ flex: 1 }} />
                            <button className="btn btn-primary btn-sm" onClick={() => addNote('todo', newTodo)} disabled={saving || !newTodo.trim()}><Plus size={14} /> Add</button>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {todos.length === 0 && <div style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', padding: 24 }}>No to-do items yet</div>}
                        {todos.map(todo => (
                            <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                <button onClick={() => toggleTodo(todo)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: todo.meta?.done ? '#059669' : 'var(--border)', padding: 0 }}>
                                    <CheckSquare size={18} />
                                </button>
                                <span style={{ flex: 1, fontSize: 14, textDecoration: todo.meta?.done ? 'line-through' : 'none', color: todo.meta?.done ? 'var(--text-dim)' : 'var(--text)' }}>{todo.content}</span>
                                {canAddTodo && <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteNote(todo.id)}><Trash2 size={13} /></button>}
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* ── MEETING NOTES ───────── */}
            {tab === 'notes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {canManage && (
                        <div className="card" style={{ padding: 18 }}>
                            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Add Meeting Note</h3>
                            <textarea className="form-textarea" rows={4} placeholder="Write meeting minutes, decisions, action items…" value={newNote} onChange={e => setNewNote(e.target.value)} style={{ resize: 'vertical', marginBottom: 10 }} />
                            <button className="btn btn-primary btn-sm" onClick={() => addNote('meeting', newNote)} disabled={saving || !newNote.trim()}><Plus size={13} /> Save Note</button>
                        </div>
                    )}
                    {notes.length === 0 && <div className="card"><div className="empty-state"><p>No meeting notes yet</p></div></div>}
                    {notes.map(note => (
                        <div key={note.id} className="card" style={{ padding: 18 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{note.title || 'Meeting Note'}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(note.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                </div>
                                {canManage && <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteNote(note.id)}><Trash2 size={13} /></button>}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.7, borderLeft: '3px solid var(--accent)', paddingLeft: 14 }}>{note.content}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── BRD ─────────────────── */}
            {tab === 'brd' && (
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Business Requirements Document</h3>
                        {canManage && !brdEditing && <button className="btn btn-ghost btn-sm" onClick={() => setBrdEditing(true)}><Pencil size={13} /> {brd ? 'Edit' : 'Write BRD'}</button>}
                        {brdEditing && (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => { setBrdEditing(false); setBrdContent(brd?.content || '') }}><X size={13} /> Cancel</button>
                                <button className="btn btn-primary btn-sm" onClick={saveBrd} disabled={saving}><Save size={13} /> Save</button>
                            </div>
                        )}
                    </div>
                    {brdEditing ? (
                        <textarea className="form-textarea" rows={24} placeholder="Write the BRD here…" value={brdContent} onChange={e => setBrdContent(e.target.value)} style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8 }} />
                    ) : brd ? (
                        <div style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: 'pre-wrap', color: 'var(--text)', background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 20, border: '1px solid var(--border)' }}>{brd.content}</div>
                    ) : (
                        <div className="empty-state" style={{ padding: 48 }}>
                            <FileText size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                            <p>No BRD written yet</p>
                            {canManage && <button className="btn btn-primary btn-sm" onClick={() => setBrdEditing(true)}><Plus size={13} /> Start Writing</button>}
                        </div>
                    )}
                    </div> {/* end left column */}

            {/* RIGHT: Always-visible Milestones Panel */}
            <div style={{ position: 'sticky', top: 20 }}>
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Flag size={15} style={{ color: '#0891b2' }} />
                            <span style={{ fontWeight: 700, fontSize: 14 }}>Milestones</span>
                            <span style={{ background: 'var(--border)', borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{milestones.length}</span>
                        </div>
                        {canManage && <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowMsForm(f => !f)} title="Add Milestone"><Plus size={14} /></button>}
                    </div>

                    {/* Progress */}
                    {milestones.length > 0 && (
                        <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                                <span style={{ fontWeight: 700, color: '#0891b2' }}>{msDone}/{milestones.length}</span>
                            </div>
                            <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#10b981,#059669)', width: `${milestones.length ? (msDone / milestones.length) * 100 : 0}%`, transition: 'width 0.5s' }} />
                            </div>
                        </div>
                    )}

                    {/* Add form inline */}
                    {canManage && (showMsForm || editingMs) && (
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                            <form onSubmit={saveMilestone}>
                                <div className="form-group" style={{ marginBottom: 8 }}>
                                    <input className="form-input" placeholder="Milestone title *" value={newMs.title} onChange={e => setNewMs(p => ({ ...p, title: e.target.value }))} required style={{ fontSize: 13 }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 8 }}>
                                    <input type="date" className="form-input" value={newMs.due_date} onChange={e => setNewMs(p => ({ ...p, due_date: e.target.value }))} style={{ fontSize: 13 }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 8 }}>
                                    <select className="form-select" value={newMs.status} onChange={e => setNewMs(p => ({ ...p, status: e.target.value }))} style={{ fontSize: 13 }}>
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => { setShowMsForm(false); setEditingMs(null); setNewMs({ title: '', description: '', due_date: '', status: 'pending' }) }}>Cancel</button>
                                    <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={saving}>{editingMs ? 'Update' : 'Add'}</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Milestone list */}
                    <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                        {milestones.length === 0 && (
                            <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                                {canManage ? 'Click + to add the first milestone' : 'No milestones yet'}
                            </div>
                        )}
                        {milestones.map(ms => {
                            const isOverdue = ms.due_date && new Date(ms.due_date) < today && ms.status !== 'completed'
                            const msColor = MS_STATUS[ms.status]?.color || '#6b7280'
                            return (
                                <div key={ms.id} style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', borderLeft: `3px solid ${msColor}` }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ background: msColor + '22', color: msColor, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>{MS_STATUS[ms.status]?.label}</span>
                                                {ms.title}
                                            </div>
                                            {ms.due_date && (
                                                <div style={{ fontSize: 11, marginTop: 3, color: isOverdue ? '#dc2626' : 'var(--text-dim)', fontWeight: isOverdue ? 700 : 400 }}>
                                                    {isOverdue && '🔴 '}Due: {new Date(ms.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </div>
                                            )}
                                        </div>
                                        {canManage && (
                                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                                {ms.status !== 'completed' && (
                                                    <button className="btn btn-ghost btn-sm btn-icon" title={ms.status === 'pending' ? 'Start' : 'Complete'} onClick={() => updateMsStatus(ms, ms.status === 'pending' ? 'in_progress' : 'completed')}>
                                                        <Check size={12} />
                                                    </button>
                                                )}
                                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingMs(ms); setShowMsForm(true); setNewMs({ title: ms.title, description: ms.description || '', due_date: ms.due_date || '', status: ms.status }) }}><Pencil size={12} /></button>
                                                <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteMilestone(ms.id)}><Trash2 size={12} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            </div> {/* end two-column grid */}
        </div>
    )
}
