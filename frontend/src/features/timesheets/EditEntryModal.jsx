import { useState, useEffect } from 'react'
import { X, Save, Clock, Calendar, FileText, RotateCcw } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import QAFeedbackTrail from '../../components/common/QAFeedbackTrail'
import { useAuth } from '../../context/AuthContext'

export default function EditEntryModal({ entry, myProjects, onClose, onSaved }) {
    const { user } = useAuth()
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
            const isResubmitting = entry.status === 'failed' && developerReply.trim();
            const res = await api.patch(`/timesheets/entries/${entry.id}`, {
                title: title.trim(),
                project_id: projectId,
                hours_spent: time,
                notes: notes.trim(),
                developer_reply: developerReply.trim(),
                status: isResubmitting ? 'done' : entry.status
            })

            if (isResubmitting) {
                await api.post(`/timesheets/entries/${entry.id}/feedback`, {
                    content: developerReply.trim(),
                    new_status: 'done'
                });
            }

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
                <form id="edit-entry-form" onSubmit={handleSave} className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', padding: 0, overflow: 'hidden', flex: 1 }}>
                    {(() => {
                        const isLocked = !['admin', 'super_admin', 'director'].some(r => user?.roles?.some(ur => (typeof ur === 'string' ? ur : ur.name).toLowerCase().includes(r))) && ['done', 'verified', 'failed'].includes(entry.status);
                        const isFailed = entry.status === 'failed';
                        const isEditable = !isLocked; // Stricter locking: once submitted, it's locked.

                        return (
                            <>
                                {/* Left Side: History */}
                                <div className="history-pane" style={{ padding: '24px', background: 'rgba(0,0,0,0.1)', borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
                                    <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '16px', letterSpacing: '0.05em' }}>
                                        Communication Logs
                                    </h4>
                                    <QAFeedbackTrail type="todo" itemId={entry.id} />
                                </div>

                                {/* Right Side: Form */}
                                <div style={{ padding: '24px', overflowY: 'auto' }}>
                                    <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '16px', letterSpacing: '0.05em' }}>
                                        Activity Details
                                    </h4>

                                    <div className="form-group">
                                        <label className="form-label">Project</label>
                                        <select
                                            className="form-select"
                                            value={projectId}
                                            onChange={e => setProjectId(e.target.value)}
                                            required
                                            disabled={!isEditable}
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
                                            disabled={!isEditable}
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
                                            disabled={!isEditable}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Notes</label>
                                        <textarea
                                            className="form-textarea"
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            rows={6}
                                            placeholder="Brief details..."
                                            required
                                            disabled={!isEditable}
                                        />
                                    </div>

                                    {isFailed && (
                                        <div className="form-group" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: 12, marginTop: 20, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                            <label className="form-label" style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <RotateCcw size={14} /> Resubmit Note
                                            </label>
                                            <textarea
                                                className="form-textarea"
                                                value={developerReply}
                                                onChange={e => setDeveloperReply(e.target.value)}
                                                rows={4}
                                                placeholder="Describe your fix..."
                                                required
                                                style={{ marginTop: 8 }}
                                            />
                                            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
                                                Saving will mark status as <strong>DONE</strong> for re-testing.
                                            </p>
                                        </div>
                                    )}

                                    {isLocked && !isFailed && (
                                        <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)', marginTop: 12 }}>
                                            <p style={{ margin: 0, fontSize: 12, color: '#34d399', textAlign: 'center' }}>
                                                This activity is locked while under review.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
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
