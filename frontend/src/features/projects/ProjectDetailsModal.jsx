import { useState, useEffect } from 'react'
import { X, Users, FileText, MessageSquare, Plus, Trash2, Download, CloudUpload, Lock, UserPlus, UserMinus, Save } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function ProjectDetailsModal({ project, allUsers, onClose, onSaved }) {
    const { user: currentUser, hasPermission } = useAuth()
    const [activeTab, setActiveTab] = useState('team')

    // Team State
    const [members, setMembers] = useState([])
    const [memberLoading, setMemberLoading] = useState(false)
    const [newMember, setNewMember] = useState({ userId: '', role: 'member' })

    // Files State
    const [files, setFiles] = useState([])
    const [fileLoading, setFileLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [newFile, setNewFile] = useState({ filename: '', file_type: 'BRD' })

    // Notes State
    const [notes, setNotes] = useState([])
    const [noteLoading, setNoteLoading] = useState(false)
    const [newNote, setNewNote] = useState('')

    const isAdmin = hasPermission('manage_projects')

    useEffect(() => {
        loadTeam()
        loadFiles()
        loadNotes()
    }, [project.id])

    // --- Team logic ---
    const loadTeam = async () => {
        setMemberLoading(true)
        try {
            const r = await api.get(`/projects/${project.id}/members`)
            setMembers(r.data.data)
        } catch (err) { toast.error(err.message) }
        finally { setMemberLoading(false) }
    }

    const handleAddMember = async (e) => {
        e.preventDefault()
        if (!newMember.userId) return
        try {
            await api.post(`/projects/${project.id}/members`, { user_id: newMember.userId, role: newMember.role })
            toast.success('Member added')
            setNewMember({ userId: '', role: 'member' })
            loadTeam()
            onSaved()
        } catch (err) { toast.error(err.message) }
    }

    const handleRemoveMember = async (membUserId) => {
        try {
            await api.delete(`/projects/${project.id}/members/${membUserId}`)
            toast.success('Member removed')
            loadTeam()
            onSaved()
        } catch (err) { toast.error(err.message) }
    }

    // --- Files logic ---
    const loadFiles = async () => {
        setFileLoading(true)
        try {
            const r = await api.get(`/project-files/project/${project.id}`)
            setFiles(r.data.data)
        } catch (err) { toast.error(err.message) }
        finally { setFileLoading(false) }
    }

    const handleUploadFile = async (e) => {
        e.preventDefault()
        if (!selectedFile) return toast.error('Please select a file')

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('filename', newFile.filename || selectedFile.name)
            formData.append('file_type', newFile.file_type)

            await api.post(`/project-files/project/${project.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            toast.success('File uploaded and added')
            setNewFile({ filename: '', file_type: 'BRD' })
            setSelectedFile(null)
            loadFiles()
        } catch (err) {
            toast.error(err.response?.data?.message || err.message)
        } finally {
            setUploading(false)
        }
    }

    const handleDeleteFile = async (id) => {
        try {
            await api.delete(`/project-files/${id}`)
            toast.success('File deleted')
            loadFiles()
        } catch (err) { toast.error(err.message) }
    }

    // --- Notes logic ---
    const loadNotes = async () => {
        setNoteLoading(true)
        try {
            const r = await api.get(`/project-notes/project/${project.id}`)
            setNotes(r.data.data)
        } catch (err) { toast.error(err.message) }
        finally { setNoteLoading(false) }
    }

    const handleAddNote = async (e) => {
        e.preventDefault()
        if (!newNote.trim()) return
        try {
            await api.post(`/project-notes/project/${project.id}`, { content: newNote })
            toast.success('Note added')
            setNewNote('')
            loadNotes()
        } catch (err) { toast.error(err.message) }
    }

    const handleDeleteNote = async (id) => {
        try {
            await api.delete(`/project-notes/${id}`)
            toast.success('Note deleted')
            loadNotes()
        } catch (err) { toast.error(err.message) }
    }

    const assignedIds = members.map(m => m.user.id)
    const availableUsers = allUsers.filter(u => !assignedIds.includes(u.id))

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg" style={{ height: '85vh' }}>
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">{project.name}</h2>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Project Details & Collaboration</p>
                    </div>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="tabs" style={{ margin: '0 24px', marginTop: 16 }}>
                    <button className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
                        <Users size={14} style={{ marginRight: 6 }} /> Team
                    </button>
                    <button className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
                        <FileText size={14} style={{ marginRight: 6 }} /> Files
                    </button>
                    <button className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
                        <MessageSquare size={14} style={{ marginRight: 6 }} /> Meeting Notes
                    </button>
                </div>

                <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                    {/* --- PROJECT INFO --- */}
                    {(project.client_name || project.sub_types?.length > 0) && (
                        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                            {project.client_name && (
                                <div style={{ flex: 1, minWidth: 200, padding: 12, background: 'var(--surface-light)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Client</div>
                                    <div style={{ fontSize: 13, fontWeight: 700 }}>{project.client_name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{project.client_email} {project.client_phone ? `• ${project.client_phone}` : ''}</div>
                                    {project.acquisition_date && (
                                        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontWeight: 600 }}>Acquired: {project.acquisition_date}</div>
                                    )}
                                </div>
                            )}
                            {project.sub_types?.length > 0 && (
                                <div style={{ flex: 1, minWidth: 200, padding: 12, background: 'var(--surface-light)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Categories</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {project.sub_types.map(t => (
                                            <span key={t} style={{ fontSize: 10, background: 'var(--bg-card)', padding: '1px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>{t}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- TEAM TAB --- */}
                    {activeTab === 'team' && (
                        <div>
                            {isAdmin && (
                                <form onSubmit={handleAddMember} style={{ marginBottom: 24, padding: 16, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Add Team Member</p>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <select className="form-select" style={{ flex: 2 }}
                                            value={newMember.userId} onChange={e => setNewMember(p => ({ ...p, userId: e.target.value }))}>
                                            <option value="">Select employee…</option>
                                            {availableUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
                                        </select>
                                        <select className="form-select" style={{ flex: 1 }}
                                            value={newMember.role} onChange={e => setNewMember(p => ({ ...p, role: e.target.value }))}>
                                            <option value="member">Member</option>
                                            <option value="manager">Manager</option>
                                        </select>
                                        <button type="submit" className="btn btn-primary" disabled={!newMember.userId}><Plus size={16} /> Add</button>
                                    </div>
                                </form>
                            )}

                            {memberLoading ? <div className="spinner" /> : (
                                <table className="table">
                                    <thead><tr><th>Name</th><th>Email</th><th>Role</th>{isAdmin && <th></th>}</tr></thead>
                                    <tbody>
                                        {members.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-dim)' }}>No members yet</td></tr>}
                                        {members.map(m => (
                                            <tr key={m.id}>
                                                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div className="user-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{m.user.full_name[0]}</div>
                                                    <strong>{m.user.full_name}</strong>
                                                </div></td>
                                                <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>{m.user.email}</td>
                                                <td><span className={`badge ${m.role === 'manager' ? 'badge-purple' : 'badge-gray'}`}>{m.role}</span></td>
                                                {isAdmin && (
                                                    <td>
                                                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleRemoveMember(m.user.id)}><UserMinus size={14} /></button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* --- FILES TAB --- */}
                    {activeTab === 'files' && (
                        <div>
                            {hasPermission('manage_project_files') && (
                                <form onSubmit={handleUploadFile} style={{ marginBottom: 24, padding: 16, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Upload Project Document</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr auto', gap: 10 }}>
                                        <input className="form-input" placeholder="Display Name (Optional)"
                                            value={newFile.filename} onChange={e => setNewFile(p => ({ ...p, filename: e.target.value }))} />

                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <input type="file" id="project-file-upload" hidden onChange={e => setSelectedFile(e.target.files[0])} />
                                            <label htmlFor="project-file-upload" className="form-input" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                <CloudUpload size={14} /> {selectedFile ? selectedFile.name : 'Select File (Max 100MB)'}
                                            </label>
                                        </div>

                                        <select className="form-select" value={newFile.file_type} onChange={e => setNewFile(p => ({ ...p, file_type: e.target.value }))}>
                                            <option value="BRD">BRD</option>
                                            <option value="Quotation">Quotation</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Other">Other</option>
                                        </select>

                                        <button type="submit" className="btn btn-primary" disabled={uploading || !selectedFile}>
                                            {uploading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Uploading...</> : <><CloudUpload size={16} /> Add</>}
                                        </button>
                                    </div>
                                    <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 8 }}>Supports all file types up to 100MB.</p>
                                </form>
                            )}

                            {fileLoading ? <div className="spinner" /> : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                                    {files.length === 0 && <p style={{ color: 'var(--text-dim)', textAlign: 'center', gridColumn: '1/-1', padding: 40 }}>No files uploaded yet</p>}
                                    {files.map(f => (
                                        <div key={f.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ padding: 8, background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)', borderRadius: 8 }}>
                                                    <FileText size={20} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.filename}</p>
                                                    <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>{f.file_type} • {new Date(f.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                                {/* Use fl_attachment to force download from Cloudinary */}
                                                <a href={f.file_url.replace('/upload/', '/upload/fl_attachment/')}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="btn btn-ghost btn-sm" style={{ flex: 1 }}
                                                    download={f.filename}>
                                                    <Download size={14} /> View / Download
                                                </a>
                                                {hasPermission('manage_project_files') && (
                                                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteFile(f.id)}><Trash2 size={14} /></button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- NOTES TAB --- */}
                    {activeTab === 'notes' && (
                        <div>
                            {hasPermission('manage_project_notes') && (
                                <form onSubmit={handleAddNote} style={{ marginBottom: 24 }}>
                                    <textarea className="form-textarea" rows={3} placeholder="Add meeting notes, client requirements, or project updates…"
                                        value={newNote} onChange={e => setNewNote(e.target.value)} />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                                        <button type="submit" className="btn btn-primary" disabled={!newNote.trim()}><Plus size={16} /> Save Note</button>
                                    </div>
                                </form>
                            )}

                            {noteLoading ? <div className="spinner" /> : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {notes.length === 0 && <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 40 }}>No meeting notes yet</p>}
                                    {notes.map(n => (
                                        <div key={n.id} className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div className="user-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{n.creator.full_name[0]}</div>
                                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{n.creator.full_name}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{new Date(n.created_at).toLocaleString()}</span>
                                                    {currentUser?.id === n.created_by && (
                                                        <button className="btn-icon" onClick={() => handleDeleteNote(n.id)} style={{ color: 'var(--danger)', padding: 0 }}><Trash2 size={13} /></button>
                                                    )}
                                                </div>
                                            </div>
                                            <p style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{n.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    )
}
