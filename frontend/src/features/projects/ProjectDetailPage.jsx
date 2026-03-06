import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, ListTodo, Users, CheckSquare, BookOpen, FileText, Flag,
    Plus, Trash2, Check, Clock, AlertCircle, CheckCircle2, Save, Pencil, X, UserPlus, UserMinus, Calendar
} from 'lucide-react'
import { getISTDate } from '../../lib/dateUtils'
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
    const { hasPermission, hasRole } = useAuth()
    const canManage = hasPermission('manage_projects')

    const [tab, setTab] = useState('overview')
    const [project, setProject] = useState(null)
    const [tasks, setTasks] = useState([])
    const [notes, setNotes] = useState([])
    const [files, setFiles] = useState([])
    const [brd, setBrd] = useState(null)
    const [milestones, setMilestones] = useState([])
    const [timesheets, setTimesheets] = useState([])
    const [tsUserFilter, setTsUserFilter] = useState('')
    const [members, setMembers] = useState([])
    const [allUsers, setAllUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Forms
    const [newNote, setNewNote] = useState('')
    const [brdContent, setBrdContent] = useState('')
    const [brdEditing, setBrdEditing] = useState(false)
    const [newMember, setNewMember] = useState({ userId: '', role: 'member' })
    const [newMs, setNewMs] = useState({ title: '', description: '', due_date: '', status: 'pending' })
    const [showMsForm, setShowMsForm] = useState(false)
    const [editingMs, setEditingMs] = useState(null)
    // Task edit
    const [editingTask, setEditingTask] = useState(null)
    const [taskForm, setTaskForm] = useState({})

    const PROJECT_STATUS = {
        active: { label: 'Active', color: '#10b981' },
        on_hold: { label: 'On Hold', color: '#f59e0b' },
        completed: { label: 'Completed', color: '#0891b2' },
        cancelled: { label: 'Cancelled', color: '#dc2626' },
        planning: { label: 'Planning', color: '#7c3aed' },
    }

    const load = async () => {
        setLoading(true)
        try {
            const [pRes, tRes, nRes, msRes, memRes, tsRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get('/tasks', { params: { project_id: id } }),
                api.get(`/project-notes/project/${id}`).catch(() => ({ data: { data: [] } })),
                api.get(`/milestones/project/${id}`).catch(() => ({ data: { data: [] } })),
                api.get(`/projects/${id}/members`).catch(() => ({ data: { data: [] } })),
                api.get(`/timesheets/project/${id}`).catch((err) => { console.error('Timesheet fetch err:', err); return { data: { data: [] } }; }),
            ])
            setProject(pRes.data.data)
            setTasks(tRes.data.data || [])
            const allNotes = nRes.data.data || []
            setNotes(allNotes.filter(n => !n.meta?.is_file && n.title !== 'BRD' && n.type !== 'brd'))
            setFiles(allNotes.filter(n => n.meta?.is_file))
            setMilestones(msRes.data.data || [])
            setMembers(memRes.data.data || [])
            setTimesheets(tsRes.data.data || [])

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

    // Note Actions

    const addNote = async (type, content) => {
        if (!content.trim()) return
        setSaving(true)
        try {
            await api.post(`/project-notes/project/${id}`, {
                type,
                content: content.trim(),
                title: `Meeting — ${new Date().toLocaleDateString('en-IN')}`,
            })
            toast.success('Saved')
            setNewNote('')
            load()
        } catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const deleteNote = async (noteId) => {
        try { await api.delete(`/project-notes/${noteId}`); load() }
        catch (err) { toast.error(err.message) }
    }

    const uploadFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setSaving(true);
        toast.loading('Uploading file...', { id: 'upload' });

        try {
            await api.post(`/project-notes/project/${id}/files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('File uploaded successfully', { id: 'upload' });
            load();
        } catch (err) {
            toast.error(err.message, { id: 'upload' });
        } finally {
            setSaving(false);
            e.target.value = ''; // Reset input
        }
    };

    const downloadCsv = () => {
        if (!timesheets.length) return toast.error('No timesheet data to download')

        const headers = ['Date', 'Developer', 'Task', 'Hours', 'Notes']
        const csvRows = [headers.join(',')]

        // Use filtered timesheets if simple filter was applied, or all if none
        const dataToExport = tsUserFilter ? timesheets.filter(ts => ts.user?.id === tsUserFilter) : timesheets

        for (const ts of dataToExport) {
            const date = ts.work_date ? new Date(ts.work_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
            const dev = ts.user?.full_name || ''
            const task = ts.task?.title || ts.title || 'Direct'
            const hrs = ts.hours_spent || ''
            const notes = `"${(ts.notes || '').replace(/"/g, '""')}"`
            csvRows.push([date, dev, task, hrs, notes].join(','))
        }

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.setAttribute('hidden', '')
        a.setAttribute('href', url)
        a.setAttribute('download', `${project?.name.replace(/\s+/g, '_')}_Timesheets.csv`)
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    const handleDownload = async (fileUrl, fileName) => {
        try {
            toast.loading(`Downloading ${fileName}...`, { id: 'download' })
            // Fetch the file as a Blob to bypass cross-origin restrictions on the download loop
            const response = await fetch(fileUrl)
            const blob = await response.blob()

            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.style.display = 'none'
            a.href = url
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            toast.success('Download complete', { id: 'download' })
        } catch (err) {
            toast.error('Failed to download file', { id: 'download' })
            console.error('Download error:', err)
        }
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

    const [taskUserFilter, setTaskUserFilter] = useState('')
    const [taskDateRange, setTaskDateRange] = useState({ startDate: '', endDate: '' })

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

    const openEditTask = (t) => {
        setEditingTask(t)
        setTaskForm({
            title: t.title || '',
            description: t.description || '',
            status: t.status || 'pending',
            priority: t.priority || 'medium',
            end_time: t.end_time ? t.end_time.slice(0, 10) : '',
            estimated_hours: t.estimated_hours || '',
        })
    }

    const saveTask = async (e) => {
        e.preventDefault(); setSaving(true)
        try {
            const payload = {
                title: taskForm.title,
                description: taskForm.description,
                status: taskForm.status,
                priority: taskForm.priority,
                estimated_hours: taskForm.estimated_hours ? Number(taskForm.estimated_hours) : undefined,
                end_time: taskForm.end_time || null,
            }
            await api.patch(`/tasks/${editingTask.id}`, payload)
            toast.success('Task updated'); setEditingTask(null); load()
        } catch (err) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    if (loading) return <div className="page-loader"><div className="spinner" /></div>
    if (!project) return null

    const today = getISTDate()
    const tasksDone = (tasks || []).filter(t => t.status === 'done').length
    const tasksIP = (tasks || []).filter(t => t.status === 'in_progress').length
    const tasksP = (tasks || []).filter(t => t.status === 'pending').length
    const overdue = (tasks || []).filter(t => t.end_time && new Date(t.end_time) < today && t.status !== 'done')
    const msDone = (milestones || []).filter(m => m.status === 'completed').length
    const msOverdue = (milestones || []).filter(m => m.due_date && new Date(m.due_date) < today && m.status !== 'completed')
    const assignedIds = (members || []).map(m => m.user?.id)
    const availableUsers = (allUsers || []).filter(u => !assignedIds.includes(u.id))

    return (
        <div style={{ width: '100%' }}>

            {/* ── Edit Task Modal ────── */}
            {editingTask && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div className="card" style={{ width: '100%', maxWidth: 560, padding: 28, position: 'relative' }}>
                        <button className="btn btn-ghost btn-sm btn-icon" style={{ position: 'absolute', top: 14, right: 14 }} onClick={() => setEditingTask(null)}><X size={16} /></button>
                        <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Edit Task</h3>
                        <form onSubmit={saveTask}>
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input className="form-input" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-textarea" rows={3} value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
                            </div>
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={taskForm.status} onChange={e => setTaskForm(p => ({ ...p, status: e.target.value }))}>
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Priority</label>
                                    <select className="form-select" value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Due Date</label>
                                    <input type="date" className="form-input" value={taskForm.end_time} onChange={e => setTaskForm(p => ({ ...p, end_time: e.target.value }))} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Est. Hours</label>
                                    <input type="number" className="form-input" min="0" step="0.5" value={taskForm.estimated_hours} onChange={e => setTaskForm(p => ({ ...p, estimated_hours: e.target.value }))} placeholder="e.g. 8" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setEditingTask(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}><Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/projects')}><ArrowLeft size={18} /></button>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{project.name}</h1>
                        {project.description && <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{project.description}</p>}
                    </div>

                    {/* Status Badge & Editor */}
                    <div style={{ position: 'relative' }}>
                        {canManage ? (
                            <select
                                className="form-select"
                                value={project.status || 'active'}
                                onChange={async (e) => {
                                    const newStatus = e.target.value;
                                    try {
                                        await api.patch(`/projects/${project.id}`, { status: newStatus });
                                        toast.success('Project status updated');
                                        load();
                                    } catch (err) { toast.error(err.message) }
                                }}
                                style={{
                                    appearance: 'none',
                                    padding: '4px 28px 4px 12px',
                                    borderRadius: 99,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    border: `1px solid ${PROJECT_STATUS[project.status || 'active'].color}80`,
                                    background: `${PROJECT_STATUS[project.status || 'active'].color}1a`,
                                    color: PROJECT_STATUS[project.status || 'active'].color,
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="planning">Planning</option>
                                <option value="active">Active</option>
                                <option value="on_hold">On Hold</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        ) : (
                            <span style={{
                                padding: '4px 12px',
                                borderRadius: 99,
                                fontSize: 12,
                                fontWeight: 700,
                                border: `1px solid ${PROJECT_STATUS[project.status || 'active'].color}80`,
                                background: `${PROJECT_STATUS[project.status || 'active'].color}1a`,
                                color: PROJECT_STATUS[project.status || 'active'].color
                            }}>
                                {PROJECT_STATUS[project.status || 'active'].label}
                            </span>
                        )}
                    </div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>by <strong>{project.creator?.full_name || '—'}</strong></span>
            </div>

            {/* Client & Types Strip */}
            {(project.client_name || project.sub_types?.length > 0) && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                    {project.client_name && (
                        <div className="card" style={{ flex: 1, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 280, background: 'var(--bg-card)' }}>
                            <div style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent)', padding: 8, borderRadius: 8 }}><Users size={18} /></div>
                            <div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Client Information</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{project.client_name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                                    {project.client_email} {project.client_phone ? ` • ${project.client_phone}` : ''}
                                </div>
                                {project.acquisition_date && (
                                    <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontWeight: 700 }}>
                                        Acquired on: {new Date(project.acquisition_date).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {project.sub_types?.length > 0 && (
                        <div className="card" style={{ flex: 1, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 280, background: 'var(--bg-card)' }}>
                            <div style={{ background: 'rgba(8, 145, 178, 0.1)', color: '#0891b2', padding: 8, borderRadius: 8 }}><Flag size={18} /></div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Project Categories</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                                    {project.sub_types.map(t => (
                                        <span key={t} style={{ fontSize: 10, fontWeight: 600, background: 'var(--border)', color: 'var(--text)', padding: '2px 10px', borderRadius: 99 }}>
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Progress bar (Relocated to top) */}
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

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: '5px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)', overflowX: 'auto', width: '100%' }}>
                {[
                    { id: 'overview', icon: ListTodo, label: 'Tasks', count: tasks.length },
                    { id: 'team', icon: Users, label: 'Team', count: members.length },
                    { id: 'timesheets', icon: Clock, label: 'Timesheets', count: timesheets.length },
                    { id: 'notes', icon: BookOpen, label: 'Meeting Notes', count: notes.length },
                    { id: 'brd', icon: FileText, label: 'Files' },
                ].map(t => (
                    <div key={t.id} style={{ flex: 1, display: 'flex' }}>
                        <button onClick={() => setTab(t.id)}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: tab === t.id ? 700 : 500, fontSize: 13, background: tab === t.id ? 'var(--accent)' : 'transparent', color: tab === t.id ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                            <t.icon size={15} strokeWidth={2.5} fill="currentColor" />
                            {t.label}
                            {t.count !== undefined && (
                                <span style={{ background: tab === t.id ? 'rgba(255,255,255,0.3)' : 'var(--border)', borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Two-column layout: main content + always-visible milestones panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

                {/* LEFT: main tab content */}
                <div>

                    {/* ── TASKS ───────────────── */}
                    {tab === 'overview' && (
                        <Section
                            title="All Tasks"
                            action={
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <select className="form-select" style={{ padding: '6px 28px 6px 10px', fontSize: 12 }} value={taskUserFilter} onChange={e => setTaskUserFilter(e.target.value)}>
                                        <option value="">All Developers</option>
                                        {members.filter(m => m.user).map(m => (
                                            <option key={m.user.id} value={m.user.id}>{m.user.full_name}</option>
                                        ))}
                                    </select>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <input type="date" className="form-input" style={{ padding: '4px 8px', fontSize: 12, width: 120 }} value={taskDateRange.startDate} onChange={e => setTaskDateRange(p => ({ ...p, startDate: e.target.value }))} />
                                        <span style={{ color: 'var(--text-dim)' }}>-</span>
                                        <input type="date" className="form-input" style={{ padding: '4px 8px', fontSize: 12, width: 120 }} value={taskDateRange.endDate} onChange={e => setTaskDateRange(p => ({ ...p, endDate: e.target.value }))} />
                                    </div>
                                    {canManage && <button className="btn btn-primary btn-sm" onClick={() => navigate('/tasks', { state: { openCreateModal: true, project_id: id } })}><Plus size={13} strokeWidth={3} fill="currentColor" /> Add Task</button>}
                                </div>
                            }
                        >
                            {!tasks || tasks.length === 0 ? <div className="empty-state"><p>No tasks yet</p></div> : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                {['Task', 'Assignee', 'Status', 'Priority', 'Due Date', 'Hours', 'Actions'].map(h => (
                                                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks
                                                .filter(t => !taskUserFilter || t.assignee?.id === taskUserFilter)
                                                .filter(t => {
                                                    if (!taskDateRange.startDate && !taskDateRange.endDate) return true;
                                                    const taskDate = t.end_time ? new Date(t.end_time) : null;
                                                    if (!taskDate) return false;
                                                    if (taskDateRange.startDate && taskDate < new Date(taskDateRange.startDate)) return false;
                                                    if (taskDateRange.endDate && taskDate > new Date(taskDateRange.endDate)) return false;
                                                    return true;
                                                })
                                                .map(t => {
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
                                                            <td style={{ padding: '9px 6px', textAlign: 'right' }}>
                                                                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                                                    <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => openEditTask(t)}><Pencil size={13} /></button>
                                                                    {hasRole('super_admin') && <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={async () => { if (confirm('Delete this task?')) { try { await api.delete(`/tasks/${t.id}`); load() } catch (e) { toast.error(e.message) } } }}><Trash2 size={13} /></button>}
                                                                </div>
                                                            </td>
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

                    {/* ── FILES (CLOUDINARY) ──────── */}
                    {tab === 'brd' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {canManage && (
                                <div className="card" style={{ padding: 24, textAlign: 'center', border: '2px dashed var(--border)', background: 'transparent' }}>
                                    <input
                                        type="file"
                                        id="file-upload"
                                        style={{ display: 'none' }}
                                        onChange={uploadFile}
                                        disabled={saving}
                                    />
                                    <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: '50%', color: 'var(--text-muted)' }}>
                                            <Plus size={24} />
                                        </div>
                                        <div>
                                            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700 }}>Upload a generic file or BRD</p>
                                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-dim)' }}>Select any file up to 10MB</p>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {files.length === 0 ? (
                                <div className="card"><div className="empty-state"><p>No files uploaded yet for this project</p></div></div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                                    {files.map(file => (
                                        <div key={file.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{ background: 'var(--accent)', color: '#fff', padding: 10, borderRadius: 8 }}>
                                                <FileText size={20} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={file.title}>
                                                    {file.title}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, display: 'flex', gap: 8 }}>
                                                    <span>{(file.meta?.size / 1024).toFixed(1)} KB</span>
                                                    <span>•</span>
                                                    <span>{new Date(file.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <button
                                                    onClick={() => handleDownload(file.meta?.url, file.title)}
                                                    className="btn btn-ghost btn-sm btn-icon"
                                                    title="Download File"
                                                >⬇</button>
                                                {canManage && (
                                                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteNote(file.id)}><Trash2 size={14} /></button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
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



                    {/* ── TIMESHEETS ──────────────── */}
                    {tab === 'timesheets' && (
                        <Section title="Project Timesheets" action={
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                {timesheets.length > 0 && (
                                    <select className="form-select" style={{ padding: '6px 28px 6px 10px', fontSize: 12 }} value={tsUserFilter} onChange={e => setTsUserFilter(e.target.value)}>
                                        <option value="">All Developers</option>
                                        {[...new Map(timesheets.filter(t => t.user).map(t => [t.user.id, t.user])).values()].map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name}</option>
                                        ))}
                                    </select>
                                )}
                                <button className="btn btn-ghost btn-sm" onClick={downloadCsv} disabled={!timesheets.length}><FileText size={13} /> Export CSV</button>
                            </div>
                        }>
                            {timesheets.length === 0 ? <div className="empty-state"><p>No timesheet entries logged for this project yet</p></div> : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                {['Date', 'Developer', 'Task', 'Task Due Date', 'Hours', 'Notes'].map(h => (
                                                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(tsUserFilter ? timesheets.filter(ts => ts.user?.id === tsUserFilter) : timesheets).map(ts => (
                                                <tr key={ts.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                        {ts.work_date ? new Date(ts.work_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                    </td>
                                                    <td style={{ padding: '12px 14px' }}>
                                                        {ts.user ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <Avatar name={ts.user.full_name} i={0} size={24} />
                                                                <div>
                                                                    <div style={{ fontSize: 12, fontWeight: 700 }}>{ts.user.full_name}</div>
                                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ts.user.email}</div>
                                                                </div>
                                                            </div>
                                                        ) : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', fontSize: 13, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ts.task?.title || ts.title}>
                                                        <strong>{ts.task ? ts.task.title : ts.title}</strong>
                                                        {!ts.task && <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2 }}>Non-task / Direct</div>}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                                                        {ts.task?.end_time ? new Date(ts.task.end_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: 'var(--accent)' }}>
                                                        {ts.hours_spent}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                                                        {ts.notes ? ts.notes : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Section>
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

            </div > {/* end two-column grid */}
        </div >
    )
}
