import { useState, useEffect } from 'react'
import { X, Save, Clock, Calendar, FileText } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function EditEntryModal({ entry, myProjects, onClose, onSaved }) {
    const [title, setTitle] = useState(entry.title || '')
    const [projectId, setProjectId] = useState(entry.project_id || '')
    const [time, setTime] = useState(entry.hours_spent || '00:00')
    const [notes, setNotes] = useState(entry.notes || '')
    const [developerReply, setDeveloperReply] = useState(entry.developer_reply || '')
    const [saving, setSaving] = useState(false)

    const handleSave = async (e) => {
        e.preventDefault()
        if (!title.trim() || !projectId || !notes.trim() || !time || time === '00:00') {
            return toast.error('Please fill all mandatory fields.')
        }

        setSaving(true)
        try {
            const res = await api.patch(`/timesheets/entries/${entry.id}`, {
                title: title.trim(),
                project_id: projectId,
                hours_spent: time,
                notes: notes.trim(),
                developer_reply: developerReply.trim(),
                status: entry.status === 'failed' ? 'done' : entry.status
            })
            toast.success('Activity updated!')
            onSaved(res.data.data)
            onClose()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">Edit Activity</h2>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>
                <form id="edit-entry-form" onSubmit={handleSave} className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Project</label>
                        <select
                            className="form-select"
                            value={projectId}
                            onChange={e => setProjectId(e.target.value)}
                            required
                        >
                            <option value="">Select Project...</option>
                            {myProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Activity Title</label>
                        <input
                            className="form-input"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Building login screen"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Time Commitment (hh:mm)</label>
                        <input
                            type="time"
                            className="form-input"
                            value={time}
                            onChange={e => setTime(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Notes</label>
                        <textarea
                            className="form-textarea"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={20}
                            placeholder="Brief details..."
                            required
                        />
                    </div>

                    {(entry.status === 'verified' || entry.status === 'failed' || entry.qa_notes) && (
                        <div className={`qa-feedback-section ${entry.status}`} style={{
                            marginTop: 16,
                            padding: 12,
                            borderRadius: 8,
                            background: entry.status === 'failed' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            border: `1px solid ${entry.status === 'failed' ? '#ef4444' : '#10b981'}`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{
                                    fontSize: 10,
                                    fontWeight: 900,
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    background: entry.status === 'failed' ? '#ef4444' : '#10b981',
                                    color: '#fff'
                                }}>
                                    QA {entry.status === 'failed' ? 'FAILED' : 'PASSED'}
                                </span>
                            </div>
                            {entry.qa_notes && (
                                <p style={{ fontSize: 13, color: entry.status === 'failed' ? '#ef4444' : '#10b981', fontWeight: 600, margin: 0 }}>
                                    🚩 {entry.qa_notes}
                                </p>
                            )}
                            {entry.status === 'failed' && (
                                <div style={{ marginTop: 12 }}>
                                    <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>Your Reply to QA</label>
                                    <textarea
                                        className="form-textarea"
                                        value={developerReply}
                                        onChange={e => setDeveloperReply(e.target.value)}
                                        rows={2}
                                        placeholder="Explain the fix or reply to the tester..."
                                        style={{ fontSize: 13 }}
                                    />
                                    <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                                        💡 Saving will mark this as "DONE" for re-testing.
                                    </p>
                                </div>
                            )}
                            {developerReply && entry.status !== 'failed' && (
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                                    <p style={{ fontSize: 12, margin: 0 }}><strong>Your Reply:</strong> {developerReply}</p>
                                </div>
                            )}
                        </div>
                    )}
                </form>

                <div className="modal-footer">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button type="submit" form="edit-entry-form" className="btn btn-primary" disabled={saving}>
                        {saving ? <span className="spinner-sm" /> : <><Save size={16} /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    )
}
